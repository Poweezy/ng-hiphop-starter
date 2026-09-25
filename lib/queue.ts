import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { captureQueueError } from "./observability";
import {
  calculateBackoffMs,
  MAX_POLL_INTERVAL,
  MIN_POLL_INTERVAL,
  nextPollDelayMs,
} from "./queue-timing";

// Re-exported for existing importers (lib/moderation.ts) — the implementation
// lives in ./queue-timing so it stays unit-testable without the Prisma client.
export { calculateBackoffMs };

export type Task<T = unknown> = {
  id: string;
  type: string;
  payload: T;
  createdAt: Date;
  attempts: number;
  maxAttempts: number;
};

type Handler<T = unknown> = (task: Task<T>) => Promise<void>;

const handlers = new Map<string, Handler>();
let processing = false;

// ─── Concurrency control ─────────────────────────────────────────────────────

const MAX_CONCURRENT_JOBS = 5;

// ─── Stale-job watchdog ──────────────────────────────────────────────────────

const STALE_AFTER_MS = 5 * 60 * 1000; // 5 minutes
let staleRecoveryInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Periodic sweep: resets jobs stuck in "processing" for longer than
 * STALE_AFTER_MS back to "pending" so they can be retried.
 * A crashed worker that never flipped its job to completed/deadLetter
 * would otherwise strand the job forever.
 */
export async function recoverStaleJobs(): Promise<number> {
  try {
    const cutoff = new Date(Date.now() - STALE_AFTER_MS);

    const result = await prisma.job.updateMany({
      where: {
        status: "processing",
        updatedAt: { lte: cutoff },
      },
      data: {
        status: "pending",
        nextRetryAt: new Date(),
        updatedAt: new Date(),
      },
    });

    if (result.count > 0) {
      console.warn(`[queue] Recovered ${result.count} stale job(s) stuck in "processing"`);
    }

    return result.count;
  } catch (error) {
    captureQueueError(error, { jobType: 'stale-recovery' });
    return 0;
  }
}

function startStaleRecoveryScheduler() {
  if (staleRecoveryInterval) return;
  // Run every 60 seconds — infrequent enough to be cheap, frequent enough
  // to recover a stranded job within one polling window.
  staleRecoveryInterval = setInterval(() => {
    recoverStaleJobs().catch((err) => {
      captureQueueError(err, { jobType: 'stale-recovery-scheduler' });
    });
  }, 60_000);
}

// ─── Task registration / enqueue ─────────────────────────────────────────────

export function registerTask<T = unknown>(type: string, handler: Handler<T>) {
  handlers.set(type, handler as Handler);
}

export async function enqueue<T = unknown>(
  type: string,
  payload: T,
): Promise<Task<T>> {
  const task: Task<T> = {
    id: `${type}-${crypto.randomUUID()}`,
    type,
    payload,
    createdAt: new Date(),
    attempts: 0,
    maxAttempts: 3,
  };

  // Persist to database for durability across cold starts.
  await prisma.job.create({
    data: {
      id: task.id,
      type,
      payload: JSON.stringify(payload),
      maxAttempts: task.maxAttempts,
      status: "pending",
      nextRetryAt: new Date(),
    },
  });

  // Kick the processor immediately so a new job doesn't sit until the next
  // poll tick (which can be up to 30s away while the loop is backed off).
  void processQueue().catch((err) => {
    captureQueueError(err, { jobType: 'enqueue-kick' });
  });

  return task;
}

// ─── DB state transitions (report failures to Sentry) ────────────────────────

async function markJobDone(
  id: string,
  status: "completed" | "failed" | "deadLetter",
) {
  try {
    await prisma.job.update({
      where: { id },
      data: { status, updatedAt: new Date() },
    });
  } catch (err) {
    captureQueueError(err, { jobId: id, jobType: 'mark-done', attempt: 0 });
  }
}

async function incrementJobAttempt(
  id: string,
  attempts: number,
  nextRetryAt: Date | null,
) {
  try {
    await prisma.job.update({
      where: { id },
      data: {
        attempts,
        status: nextRetryAt ? "pending" : "deadLetter",
        nextRetryAt: nextRetryAt ?? undefined,
        updatedAt: new Date(),
      },
    });
  } catch (err) {
    captureQueueError(err, { jobId: id, jobType: 'increment-attempt', attempt: attempts });
  }
}

// ─── Job claiming ────────────────────────────────────────────────────────────

type JobRow = {
  id: string;
  type: string;
  payload: string;
  attempts: number;
  maxAttempts: number;
};

// Atomically claim a single pending job. The conditional updateMany ensures
// only one worker (across processes/instances) successfully flips the row
// from 'pending' to 'processing', preventing duplicate execution.
async function claimNextJob(): Promise<JobRow | null> {
  const candidates = await prisma.job.findMany({
    where: {
      status: "pending",
      OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: new Date() } }],
    },
    orderBy: { createdAt: "asc" },
    take: 10,
    select: {
      id: true,
      type: true,
      payload: true,
      attempts: true,
      maxAttempts: true,
    },
  });

  for (const candidate of candidates) {
    const result = await prisma.job.updateMany({
      where: { id: candidate.id, status: "pending" },
      data: { status: "processing", updatedAt: new Date() },
    });
    if (result.count === 1) return candidate;
  }

  return null;
}

// ─── Payload deserialisation (defensive) ─────────────────────────────────────

function deserializePayload<T>(raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    // Corrupt payload in DB — surface to Sentry with full context,
    // then throw so the job is re-attempted or dead-lettered normally.
    const error = new Error(`Queue payload JSON parse failed: ${err instanceof Error ? err.message : String(err)}`);
    captureQueueError(error, { jobType: 'payload-deserialize', attempt: 0 });
    throw error;
  }
}

// ─── Main processing loop ────────────────────────────────────────────────────

let pollIntervalMs = MIN_POLL_INTERVAL;

export async function processQueue() {
  if (processing) return;
  processing = true;

  try {
    let jobsProcessed = 0;

    while (true) {
      // Claim up to MAX_CONCURRENT_JOBS before yielding.
      const raw: { job: JobRow | null; index: number }[] = [];
      for (let i = 0; i < MAX_CONCURRENT_JOBS; i++) {
        const job = await claimNextJob();
        // Nothing claimable right now — skip the remaining claim queries so an
        // idle tick costs one DB round-trip instead of MAX_CONCURRENT_JOBS.
        if (!job) break;
        raw.push({ job, index: i });
      }

      const batch = raw.filter((entry): entry is { job: JobRow; index: number } => entry.job !== null);

      if (batch.length === 0) break;
      jobsProcessed += batch.length;

      // Process the batch concurrently, bounded by MAX_CONCURRENT_JOBS.
      await Promise.allSettled(
        batch.map(async ({ job }) => {
          const handler = handlers.get(job.type);
          if (!handler) {
            await markJobDone(job.id, "deadLetter");
            return;
          }

          const attempts = job.attempts + 1;
          const task: Task = {
            id: job.id,
            type: job.type,
            payload: deserializePayload(job.payload),
            createdAt: new Date(),
            attempts,
            maxAttempts: job.maxAttempts,
          };

          try {
            await handler(task);
            await markJobDone(job.id, "completed");
          } catch (error) {
            console.error(`Task ${task.id} failed (attempt ${attempts}):`, error);
            captureQueueError(error, { jobId: task.id, jobType: task.type, attempt: attempts });
            const nextRetryAt =
              attempts < task.maxAttempts
                ? new Date(Date.now() + calculateBackoffMs(attempts - 1))
                : null;
            await incrementJobAttempt(job.id, attempts, nextRetryAt);
          }
        }),
      );

      // Yield to the event loop after each batch so other work can run.
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }

    pollIntervalMs = nextPollDelayMs({ currentMs: pollIntervalMs, jobsProcessed });
  } finally {
    processing = false;
  }
}

// ─── Background tick ─────────────────────────────────────────────────────────

declare global {
  // Set once per server process before starting the background loop. Dev-HMR
  // re-evaluates this module on every edit; without this guard each
  // re-evaluation spawns another eternal tick loop while the previous one
  // keeps polling — multiplying DB connections until the pool's client cap
  // (e.g. Supabase session-mode pool_size: 15) is exhausted.
  var __ngQueueLoopStarted: boolean | undefined;
}

if (typeof window === "undefined") {
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
  if (!isBuildPhase && !global.__ngQueueLoopStarted) {
    global.__ngQueueLoopStarted = true;

    // Kick off the stale-job recovery sweep as soon as the module loads.
    startStaleRecoveryScheduler();

    const tick = () => {
      processQueue()
        .then(() => {
          setTimeout(tick, pollIntervalMs);
        })
        .catch((err) => {
          console.error("processQueue background tick failed:", err);
          captureQueueError(err, { jobType: 'processQueue-tick' });
          // Back off instead of retrying at the same interval — hammering an
          // exhausted connection pool every second only prolongs the outage.
          pollIntervalMs = nextPollDelayMs({
            currentMs: pollIntervalMs,
            jobsProcessed: 0,
            failed: true,
          });
          setTimeout(tick, pollIntervalMs);
        });
    };
    setTimeout(tick, pollIntervalMs);
  }
}

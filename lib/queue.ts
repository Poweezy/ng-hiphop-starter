import { prisma } from "@/app/db";
import crypto from "crypto";

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

  return task;
}

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
    console.error(`Failed to mark job ${id} as ${status}:`, err);
  }
}

async function markJobProcessing(id: string) {
  try {
    await prisma.job.update({
      where: { id },
      data: { status: "processing", updatedAt: new Date() },
    });
  } catch (err) {
    console.error(`Failed to mark job ${id} as processing:`, err);
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
    console.error(`Failed to increment attempt for job ${id}:`, err);
  }
}

// Atomically claim a single pending job. The conditional updateMany ensures
// only one worker (across processes/instances) successfully flips the row
// from 'pending' to 'processing', preventing duplicate execution.
async function claimNextJob(): Promise<{
  id: string;
  type: string;
  payload: string;
  attempts: number;
  maxAttempts: number;
} | null> {
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

let pollIntervalMs = 1000;
const MIN_POLL_INTERVAL = 1000;
const MAX_POLL_INTERVAL = 30000;
const POLL_BACKOFF_MULTIPLIER = 2;

export async function processQueue() {
  if (processing) return;
  processing = true;

  try {
    let jobsProcessed = 0;
    while (true) {
      const job = await claimNextJob();
      if (!job) break;
      jobsProcessed++;

      const handler = handlers.get(job.type);
      if (!handler) {
        await markJobDone(job.id, "deadLetter");
        continue;
      }

      const attempts = job.attempts + 1;
      const task: Task = {
        id: job.id,
        type: job.type,
        payload: JSON.parse(job.payload),
        createdAt: new Date(),
        attempts,
        maxAttempts: job.maxAttempts,
      };

      try {
        await handler(task);
        await markJobDone(job.id, "completed");
      } catch (error) {
        console.error(`Task ${task.id} failed (attempt ${attempts}):`, error);
        const nextRetryAt =
          attempts < task.maxAttempts ? new Date(Date.now() + 5000) : null;
        await incrementJobAttempt(job.id, attempts, nextRetryAt);
      }
    }

    if (jobsProcessed === 0) {
      pollIntervalMs = Math.min(pollIntervalMs * POLL_BACKOFF_MULTIPLIER, MAX_POLL_INTERVAL);
    } else {
      pollIntervalMs = MIN_POLL_INTERVAL;
    }
  } finally {
    processing = false;
  }
}

if (typeof window === "undefined") {
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
  if (!isBuildPhase) {
    const tick = () => {
      processQueue()
        .then(() => {
          setTimeout(tick, pollIntervalMs);
        })
        .catch((err) => {
          console.error("processQueue background tick failed:", err);
          setTimeout(tick, pollIntervalMs);
        });
    };
    setTimeout(tick, pollIntervalMs);
  }
}

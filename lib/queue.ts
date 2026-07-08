import { prisma } from '@/app/db';

export type Task<T = any> = {
  id: string;
  type: string;
  payload: T;
  createdAt: Date;
  attempts: number;
  maxAttempts: number;
};

type Handler<T = any> = (task: Task<T>) => Promise<void>;

const handlers = new Map<string, Handler>();
let processing = false;

export function registerTask<T = any>(type: string, handler: Handler<T>) {
  handlers.set(type, handler as Handler);
}

export async function enqueue<T = any>(type: string, payload: T): Promise<Task<T>> {
  const task: Task<T> = {
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    payload,
    createdAt: new Date(),
    attempts: 0,
    maxAttempts: 3,
  };

  // Persist to database for durability across cold starts
  await prisma.job.create({
    data: {
      id: task.id,
      type,
      payload: JSON.stringify(payload),
      maxAttempts: task.maxAttempts,
      status: 'pending',
      nextRetryAt: new Date(),
    },
  });

  return task;
}

async function markJobDone(id: string, status: 'completed' | 'failed') {
  await prisma.job.update({ where: { id }, data: { status, updatedAt: new Date() } }).catch(() => {});
}

async function markJobProcessing(id: string) {
  await prisma.job.update({ where: { id }, data: { status: 'processing', updatedAt: new Date() } }).catch(() => {});
}

async function incrementJobAttempt(id: string, attempts: number, nextRetryAt: Date | null) {
  await prisma.job.update({
    where: { id },
    data: {
      attempts,
      status: nextRetryAt ? 'pending' : 'failed',
      nextRetryAt: nextRetryAt ?? undefined,
      updatedAt: new Date(),
    },
  }).catch(() => {});
}

export async function processQueue() {
  if (processing) return;
  processing = true;

  try {
    const pendingJobs = await prisma.job.findMany({
      where: {
        status: 'pending',
        OR: [
          { nextRetryAt: null },
          { nextRetryAt: { lte: new Date() } },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });

    for (const job of pendingJobs) {
      const handler = handlers.get(job.type);
      if (!handler) {
        await markJobDone(job.id, 'failed');
        continue;
      }

      const task: Task = {
        id: job.id,
        type: job.type,
        payload: JSON.parse(job.payload),
        createdAt: job.createdAt,
        attempts: job.attempts + 1,
        maxAttempts: job.maxAttempts,
      };

      await markJobProcessing(job.id);

      try {
        await handler(task);
        await markJobDone(job.id, 'completed');
      } catch (error) {
        console.error(`Task ${task.id} failed (attempt ${task.attempts}):`, error);
        const nextRetryAt = task.attempts < task.maxAttempts ? new Date(Date.now() + 5000) : null;
        await incrementJobAttempt(job.id, task.attempts, nextRetryAt);
      }
    }
  } finally {
    processing = false;
  }
}

// Auto-process jobs in the background when running in Node.js
if (typeof window === 'undefined') {
  setInterval(() => {
    processQueue();
  }, 5000);
}

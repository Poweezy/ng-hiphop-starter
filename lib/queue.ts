export type Task<T = any> = {
  id: string;
  type: string;
  payload: T;
  createdAt: Date;
  attempts: number;
  maxAttempts: number;
};

type Handler<T = any> = (task: Task<T>) => Promise<void>;

const queue: Task[] = [];
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

  queue.push(task as Task);
  return task;
}

export async function processQueue() {
  if (processing) return;
  processing = true;

  try {
    while (queue.length > 0) {
      const task = queue.shift()!;
      const handler = handlers.get(task.type);

      if (!handler) {
        console.warn(`No handler registered for task type: ${task.type}`);
        continue;
      }

      task.attempts += 1;
      try {
        await handler(task);
      } catch (error) {
        console.error(`Task ${task.id} failed (attempt ${task.attempts}):`, error);
        if (task.attempts < task.maxAttempts) {
          queue.push(task);
        } else {
          console.error(`Task ${task.id} permanently failed after ${task.attempts} attempts`);
        }
      }
    }
  } finally {
    processing = false;
  }
}

// Auto-process tasks in the background when running in Node.js
if (typeof window === 'undefined') {
  setInterval(() => {
    if (queue.length > 0) {
      processQueue();
    }
  }, 1000);
}

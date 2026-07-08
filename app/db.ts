import { PrismaClient } from '@prisma/client';
import { registerModerationHandlers } from '@/lib/moderation';
import { processQueue } from '@/lib/queue';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error'] : [],
  });

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

// Register background task handlers once per process
registerModerationHandlers();

// Process any pending durable jobs from previous runs
processQueue();
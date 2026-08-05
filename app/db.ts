import { PrismaClient } from "@prisma/client";
import { registerModerationHandlers } from "@/lib/moderation";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error"] : [],
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;

// Register background task handlers once per process
registerModerationHandlers();

// NOTE: We intentionally do NOT call processQueue() here at module load.
// Doing so triggers a Prisma DB connection attempt during `next build`'s
// "Collecting page data" phase (when route modules are statically imported),
// which fails because the DB is unreachable at build time. Durable job
// processing is instead handled by the background interval in lib/queue.ts,
// which is guarded against the build phase.

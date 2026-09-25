// Pure queue timing math — kept dependency-free so it can be unit-tested
// without importing the Prisma client or the Sentry SDK.

/** Per-job retry delay: min(baseMs * 2^attempt, maxDelayMs). */
export function calculateBackoffMs(attempt: number): number {
  const baseMs = 5_000;
  const maxDelayMs = 300_000; // 5 minutes cap
  return Math.min(baseMs * Math.pow(2, attempt), maxDelayMs);
}

export const MIN_POLL_INTERVAL = 1000;
export const MAX_POLL_INTERVAL = 30000;
const POLL_BACKOFF_MULTIPLIER = 2;

/**
 * Delay before the next queue poll.
 * - After processing work: poll again immediately (1s).
 * - When idle or after a failed tick: back off exponentially up to 30s so a
 *   struggling database (e.g. a connection pool at its client limit) is not
 *   hammered every second.
 */
export function nextPollDelayMs(options: {
  currentMs: number;
  jobsProcessed: number;
  failed?: boolean;
}): number {
  const { currentMs, jobsProcessed, failed = false } = options;
  if (!failed && jobsProcessed > 0) return MIN_POLL_INTERVAL;
  return Math.min(
    Math.max(currentMs, MIN_POLL_INTERVAL) * POLL_BACKOFF_MULTIPLIER,
    MAX_POLL_INTERVAL,
  );
}
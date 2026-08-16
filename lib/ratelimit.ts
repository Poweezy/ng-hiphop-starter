import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ─── Env validation (fail fast at module load) ───────────────────────────────

function validateUpstashEnv(): { url: string; token: string } {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  const missing: string[] = [];
  if (!url) missing.push('UPSTASH_REDIS_REST_URL');
  if (!token) missing.push('UPSTASH_REDIS_REST_TOKEN');

  if (missing.length > 0) {
    if (process.env.NODE_ENV === 'production') {
      // Hard failure in production — rate limiting must never be silently bypassed.
      throw new Error(
        `Upstash rate-limit env vars missing: ${missing.join(', ')}. ` +
        'Rate limiting is a security control and must be configured in production.',
      );
    }
    // Dev/local: allow graceful degradation (fail-closed handled below).
    console.warn(`[ratelimit] Missing env vars: ${missing.join(', ')} — rate limiting disabled in non-production.`);
  }

  return { url: url ?? '', token: token ?? '' };
}

const { url: redisRestUrl, token: redisRestToken } = validateUpstashEnv();
const isUpstashConfigured = Boolean(redisRestUrl && redisRestToken);

let sharedRedis: Redis | null = null;
function getRedis(): Redis {
  if (!sharedRedis) {
    sharedRedis = new Redis({ url: redisRestUrl, token: redisRestToken });
  }
  return sharedRedis;
}

let limiter: Ratelimit | null = null;

function getLimiter(): Ratelimit | null {
  if (limiter) return limiter;
  if (!isUpstashConfigured) return null;

  limiter = new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(3, '60 s'),
  });
  return limiter;
}

const customLimiters = new Map<string, Ratelimit>();
const MAX_CUSTOM_LIMITERS = 50;

function enforceCustomLimiterCap() {
  while (customLimiters.size > MAX_CUSTOM_LIMITERS) {
    const oldestKey = customLimiters.keys().next().value;
    if (oldestKey !== undefined) {
      customLimiters.delete(oldestKey);
    }
  }
}

// Accepts a key + max/period override so callers can share logic.
// Returns allowed:false in production when Upstash is not configured
// (fail-closed) so abuse controls can never be silently disabled.
export async function checkRateLimit({
  key,
  max,
  periodSeconds,
}: {
  key: string;
  max?: number;
  periodSeconds?: number;
}): Promise<{ allowed: boolean; remaining: number }> {
  const base = getLimiter();

  if (max && periodSeconds) {
    const cacheKey = `${max}:${periodSeconds}`;
    let custom = customLimiters.get(cacheKey);
    if (!custom) {
      if (!isUpstashConfigured) {
        return failClosed();
      }
      custom = new Ratelimit({
        redis: getRedis(),
        limiter: Ratelimit.slidingWindow(max, `${periodSeconds} s`),
      });
      customLimiters.set(cacheKey, custom);
      enforceCustomLimiterCap();
    }

    const { success, remaining } = await custom.limit(key);
    return { allowed: !!success, remaining };
  }

  if (!base) {
    return failClosed();
  }

  const { success, remaining } = await base.limit(key);
  return { allowed: !!success, remaining };
}

/**
 * User-level rate limit helper.
 * Keys on user ID rather than IP so a compromised account behind a NAT
 * cannot bypass limits.
 *
 * @param userId - Authenticated user ID (never call with unauthenticated user).
 * @param action - Logical action name, e.g. 'quotes', 'comments'.
 * @param max - Max requests in the window (default 10).
 * @param periodSeconds - Window length in seconds (default 60).
 */
export async function checkUserRateLimit(
  userId: string,
  action: string,
  max = 10,
  periodSeconds = 60,
): Promise<{ allowed: boolean; remaining: number }> {
  return checkRateLimit({
    key: `user:${userId}:${action}`,
    max,
    periodSeconds,
  });
}

function failClosed(): { allowed: boolean; remaining: number } {
  if (process.env.NODE_ENV === 'production') {
    console.error('Rate limiting is not configured; denying request in production');
    return { allowed: false, remaining: 0 };
  }
  // Dev/local fallback so the app doesn't hard-crash without Upstash.
  return { allowed: true, remaining: Number.POSITIVE_INFINITY };
}

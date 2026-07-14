import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redisRestUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisRestToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const isUpstashConfigured = Boolean(redisRestUrl && redisRestToken);

let sharedRedis: Redis | null = null;
function getRedis(): Redis {
  if (!sharedRedis) {
    sharedRedis = new Redis({ url: redisRestUrl!, token: redisRestToken! });
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

function failClosed(): { allowed: boolean; remaining: number } {
  if (process.env.NODE_ENV === 'production') {
    console.error('Rate limiting is not configured; denying request in production');
    return { allowed: false, remaining: 0 };
  }
  // Dev/local fallback so the app doesn't hard-crash without Upstash.
  return { allowed: true, remaining: Number.POSITIVE_INFINITY };
}

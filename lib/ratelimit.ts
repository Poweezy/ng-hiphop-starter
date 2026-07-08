import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const required = (name: string, value: string | undefined) => {
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
};

const redisRestUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisRestToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const isUpstashConfigured = Boolean(redisRestUrl && redisRestToken);

let limiter: Ratelimit | null = null;

function getLimiter() {
  if (limiter) return limiter;

  if (!isUpstashConfigured) {
    // Dev/local fallback so the app doesn't hard-crash without Upstash.
    // In production you should always configure Upstash.
    return null;
  }

  required('UPSTASH_REDIS_REST_URL', redisRestUrl);
  required('UPSTASH_REDIS_REST_TOKEN', redisRestToken);


  const redis = new Redis({
    url: redisRestUrl!,
    token: redisRestToken!,
  });

  // 3 submissions per minute by default (can be overridden by passing different max)
  limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '60 s'),
  });

  return limiter;
}

const customLimiters = new Map<string, Ratelimit>();

// Accepts a key + max/period override so callers can share logic
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
      const redis = new Redis({
        url: redisRestUrl!,
        token: redisRestToken!,
      });

      const window = `${periodSeconds} s`;
      custom = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(max, window as unknown as any),
      });
      customLimiters.set(cacheKey, custom);
    }

    const { success, remaining } = await custom.limit(key);
    return { allowed: !!success, remaining };
  }

  if (!base) {
    // No Upstash configured: allow so local dev works.
    return { allowed: true, remaining: Number.POSITIVE_INFINITY };
  }

  const { success, remaining } = await base.limit(key);
  return { allowed: !!success, remaining };
}


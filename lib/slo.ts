export const SLO = {
  availability: {
    target: 0.9995,
    window: '30d',
    description: 'Application availability — measured by successful responses / total requests',
  },
  latency: {
    p95Ms: 500,
    p99Ms: 1000,
    description: 'API response latency — 95th percentile < 500ms, 99th percentile < 1s',
  },
  errorRate: {
    maxRate: 0.01,
    window: '1h',
    description: 'Server error rate (HTTP 5xx) must stay below 1%',
  },
  upload: {
    maxSizeMb: 50,
    allowedFormats: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mp4', 'image/jpeg', 'image/png', 'image/webp'],
  },
} as const;

export type SloKey = keyof typeof SLO;

export interface RequestMetric {
  method: string;
  path: string;
  status: number;
  durationMs: number;
  timestamp: number;
  error: boolean;
}

/**
 * Internal/admin paths that must NOT be included in SLO aggregates.
 * The /api/slo endpoint self-referentially inflates p95/p99 if included.
 * Health-check and admin-adjacent routes are similarly excluded.
 */
const INTERNAL_PATHS = new Set([
  '/api/slo',
  '/api/health',
  '/api/admin',
  '/api/_next',
]);

function isInternalPath(path: string): boolean {
  for (const prefix of INTERNAL_PATHS) {
    if (path === prefix || path.startsWith(`${prefix}/`)) return true;
  }
  return false;
}

// ─── Percentile with linear interpolation ────────────────────────────────────

/**
 * Returns the p-th percentile of `values` using linear interpolation.
 * Correctly handles small datasets (unlike Math.floor-based approaches).
 * @param values - Must be sorted in ascending order.
 * @param p - Percentile in [0, 100].
 */
export function percentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0;
  if (p <= 0) return sortedValues[0]!;
  if (p >= 100) return sortedValues[sortedValues.length - 1]!;

  // rank = p/100 * (n-1)  — 0-indexed position with fractional component
  const rank = (p / 100) * (sortedValues.length - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  const fraction = rank - lower;

  if (lower === upper) return sortedValues[lower]!;

  const a = sortedValues[lower]!;
  const b = sortedValues[upper]!;
  return a + (b - a) * fraction;
}

// ─── Aggregate result type ───────────────────────────────────────────────────

export interface SloAggregate {
  totalRequests: number;
  errorRate: number;
  p95Ms: number;
  p99Ms: number;
  availability: number;
  // Per-path breakdown: path → p99 latency (sorted worst-first)
  pathLatencyP99: Record<string, number>;
  // Error budget remaining: (target - current) / target  (0 = exhausted, 1 = fully remaining)
  errorBudgetAvailability: number;
  errorBudgetLatency: number;
  errorBudgetErrorRate: number;
}

/**
 * Calculates error budget remaining for a single SLI.
 * @param current - Current observed ratio (e.g. errorRate).
 * @param target - Maximum allowed ratio.
 * @returns 1.0 = full budget; 0.0 = budget exhausted; negative = over budget.
 */
export function errorBudget(current: number, target: number): number {
  return Math.max((target - current) / target, 0);
}

// ─── Collector ───────────────────────────────────────────────────────────────

class SloCollector {
  private requests: RequestMetric[] = [];
  private readonly maxSamples = 10_000;

  record(metric: RequestMetric) {
    // Skip internal/admin paths to avoid self-referential metric inflation.
    if (isInternalPath(metric.path)) return;

    this.requests.push(metric);
    if (this.requests.length > this.maxSamples) {
      this.requests = this.requests.slice(-this.maxSamples);
    }
  }

  getMetrics(): SloAggregate {
    const total = this.requests.length;
    if (total === 0) {
      return {
        totalRequests: 0,
        errorRate: 0,
        p95Ms: 0,
        p99Ms: 0,
        availability: 1,
        pathLatencyP99: {},
        errorBudgetAvailability: errorBudget(0, SLO.availability.target),
        errorBudgetLatency: errorBudget(0, SLO.latency.p99Ms),
        errorBudgetErrorRate: errorBudget(0, SLO.errorRate.maxRate),
      };
    }

    const errors = this.requests.filter((r) => r.error).length;
    const errorRate = errors / total;
    const availability = 1 - errorRate;

    const sortedDurations = this.requests
      .map((r) => r.durationMs)
      .sort((a, b) => a - b);

    const p95Ms = percentile(sortedDurations, 95);
    const p99Ms = percentile(sortedDurations, 99);

    // Per-path p99 aggregation
    const pathDurations = new Map<string, number[]>();
    for (const r of this.requests) {
      const arr = pathDurations.get(r.path);
      if (arr) {
        arr.push(r.durationMs);
      } else {
        pathDurations.set(r.path, [r.durationMs]);
      }
    }

    const pathLatencyP99: Record<string, number> = {};
    for (const [path, durations] of pathDurations) {
      pathLatencyP99[path] = percentile([...durations].sort((a, b) => a - b), 99);
    }

    return {
      totalRequests: total,
      errorRate,
      p95Ms,
      p99Ms,
      availability,
      pathLatencyP99,
      errorBudgetAvailability: errorBudget(errorRate, SLO.errorRate.maxRate),
      errorBudgetLatency: errorBudget(p99Ms, SLO.latency.p99Ms),
      errorBudgetErrorRate: errorBudget(errorRate, SLO.errorRate.maxRate),
    };
  }

  /**
   * Returns metrics for a single path only (or undefined if no data).
   * Useful for per-endpoint alerting.
   */
  getMetricsForPath(path: string): Omit<SloAggregate, 'pathLatencyP99'> | undefined {
    const filtered = this.requests.filter((r) => r.path === path);
    if (filtered.length === 0) return undefined;

    const total = filtered.length;
    const errors = filtered.filter((r) => r.error).length;
    const errorRate = errors / total;
    const sortedDurations = filtered
      .map((r) => r.durationMs)
      .sort((a, b) => a - b);

    return {
      totalRequests: total,
      errorRate,
      p95Ms: percentile(sortedDurations, 95),
      p99Ms: percentile(sortedDurations, 99),
      availability: 1 - errorRate,
      errorBudgetAvailability: errorBudget(errorRate, SLO.errorRate.maxRate),
      errorBudgetLatency: errorBudget(percentile(sortedDurations, 99), SLO.latency.p99Ms),
      errorBudgetErrorRate: errorBudget(errorRate, SLO.errorRate.maxRate),
    };
  }

  reset() {
    this.requests = [];
  }

  /**
   * Persists the current in-memory sample window to a durable time-series store
   * (e.g. a `request_metrics` table with timestamp column).
   *
   * NOTE: This is a stub. Implementing full time-series persistence requires:
   *   1. A Prisma migration adding a `request_metrics` table:
   *        model RequestMetric {
   *          id          String   @id @default(cuid())
   *          method      String
   *          path        String
   *          status      Int
   *          durationMs  Int
   *          timestamp   DateTime @default(now())
   *          error       Boolean
   *        }
   *   2. A nightly cron job that upserts batched metrics and trims records
   *      older than the longest SLO window (30d).
   *   3. Windowed aggregates computed via SQL rather than in-memory arrays,
   *      which is the only way to honestly back a `window: '30d'` claim.
   *
   * Call this from a server-only scheduled task (e.g. @vercel/cron) to flush
   * the buffer before the 10k-sample eviction drops old data.
   */
  async persistToDb(): Promise<void> {
    // Stub — replace with real implementation when a time-series store exists.
    // For now this is a no-op so callers don't break.
    return;
  }
}

export const sloCollector = new SloCollector();

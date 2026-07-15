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

class SloCollector {
  private requests: RequestMetric[] = [];
  private readonly maxSamples = 10000;

  record(metric: RequestMetric) {
    this.requests.push(metric);
    if (this.requests.length > this.maxSamples) {
      this.requests = this.requests.slice(-this.maxSamples);
    }
  }

  getMetrics() {
    const total = this.requests.length;
    if (total === 0) {
      return {
        totalRequests: 0,
        errorRate: 0,
        p95Ms: 0,
        p99Ms: 0,
        availability: 1,
      };
    }

    const errors = this.requests.filter(r => r.error).length;
    const errorRate = errors / total;
    const availability = 1 - errorRate;

    const durations = this.requests.map(r => r.durationMs).sort((a, b) => a - b);
    const p95Index = Math.floor(durations.length * 0.95);
    const p99Index = Math.floor(durations.length * 0.99);
    const p95Ms = durations[p95Index] || 0;
    const p99Ms = durations[p99Index] || 0;

    return {
      totalRequests: total,
      errorRate,
      p95Ms,
      p99Ms,
      availability,
    };
  }

  reset() {
    this.requests = [];
  }
}

export const sloCollector = new SloCollector();

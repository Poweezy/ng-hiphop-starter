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

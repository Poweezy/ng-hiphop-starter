import { sloCollector } from './slo';

export function recordRequest(method: string, path: string, status: number, durationMs: number, requestId?: string) {
  const error = status >= 500;
  const payload = {
    type: 'request',
    method,
    path,
    status,
    durationMs,
    error,
    timestamp: new Date().toISOString(),
    ...(requestId ? { requestId } : {}),
  };

  console.log(JSON.stringify(payload));
  sloCollector.record({ method, path, status, durationMs, timestamp: Date.now(), error });
}

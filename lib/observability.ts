export function recordRequest(method: string, path: string, status: number, durationMs: number) {
  const error = status >= 500;
  const payload = {
    method,
    path,
    status,
    durationMs,
    error,
    timestamp: new Date().toISOString(),
  };

  console.log(JSON.stringify({ type: 'request', ...payload }));
}

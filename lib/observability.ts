import * as Sentry from '@sentry/nextjs';
import { sloCollector } from './slo';

// ─── Legacy recordRequest (used by many route handlers) ──────────────────────

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

/**
 * Enriches the Sentry scope with request-scoped context so every captured
 * exception / transaction carries: requestId, userId (when available), path.
 *
 * Usage (server-side route handler):
 *   withSentryScope(scope => {
 *     scope.setUser({ id: session.user.id });
 *     scope.setTag('path', req.nextUrl.pathname);
 *     return scope;
 *   }, () => doWork());
 */
export function withSentryScope<T>(
  enrich: (scope: Sentry.Scope) => void,
  fn: () => Promise<T>,
): Promise<T> {
  return Sentry.withScope(async (scope) => {
    enrich(scope);
    // withScope callback may return void or a thenable depending on SDK version;
    // execute the work inside the callback so the scope is active.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    return (await fn()) as T;
  });
}

/**
 * Reports a non-fatal error to Sentry with job/task context.
 * Safe to call when Sentry is uninitialised (noop).
 */
export function captureQueueError(
  error: unknown,
  context: { jobId?: string; jobType?: string; attempt?: number },
) {
  try {
    Sentry.captureException(error, {
      tags: {
        jobId: context.jobId ?? 'unknown',
        jobType: context.jobType ?? 'unknown',
        attempt: String(context.attempt ?? 0),
        component: 'queue',
      },
    });
  } catch {
    // Sentry not initialised — swallow silently so queue never crashes on observability.
  }
}

/**
 * Env-aware tracesSampleRate. Uses 1.0 in development/staging for full
 * observability, and 0.1 in production to keep volume manageable.
 * Override with SENTRY_TRACES_SAMPLE_RATE env var at any time.
 */
export function getTracesSampleRate(): number {
  const envOverride = parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '');
  if (!Number.isNaN(envOverride) && envOverride >= 0 && envOverride <= 1) {
    return envOverride;
  }
  if (process.env.NODE_ENV === 'development') return 1.0;
  return 0.1;
}

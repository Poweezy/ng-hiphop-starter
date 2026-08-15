import * as Sentry from '@sentry/nextjs';
import { getTracesSampleRate } from '@/lib/observability';

export const onRequestError = Sentry.captureRequestError;

export async function register() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: getTracesSampleRate(),
  });
}

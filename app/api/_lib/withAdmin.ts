import { NextRequest } from 'next/server';
import { requireAdmin } from './admin';
import { getRequestId, errorResponse } from '@/lib/api';
import { recordRequest } from '@/lib/observability';
import type { Session } from 'next-auth';

/**
 * Wraps an admin API route handler with the cross-cutting concerns every
 * admin endpoint shares:
 *
 *   1. `requireAdmin()` gate — 401 JSON response on failure
 *   2. request-id propagation (x-request-id)
 *   3. request timing + `recordRequest()` observability, using the actual
 *      response status
 *   4. top-level error capture — uncaught handler errors become a logged
 *      500 JSON response instead of an unhandled rejection
 *
 * The wrapped handler receives an already-authorized context and only needs
 * to return a `Response` (use `successResponse`/`errorResponse` as usual).
 *
 * Usage — static route:
 *   export const GET = withAdmin(async ({ session }) => successResponse(...));
 *
 * Usage — dynamic route (e.g. app/api/x/[id]/route.ts):
 *   export const PATCH = withAdmin<{ id: string }>(async ({ req, params, session }) => {
 *     const { id } = await params;
 *     ...
 *   });
 */
export function withAdmin<P extends Record<string, string> = Record<string, string>>(
  handler: (ctx: {
    req: NextRequest;
    session: NonNullable<Awaited<ReturnType<typeof requireAdmin>>['session']>;
    params: P;
    requestId: string;
  }) => Promise<Response>,
) {
  return async (req: NextRequest, routeCtx?: { params: Promise<P> }): Promise<Response> => {
    const requestId = getRequestId(req);
    const start = performance.now();
    const method = req.method;
    const path = req.nextUrl.pathname;

    try {
      const { session, error } = await requireAdmin();
      if (!session || error) {
        const status = error?.status ?? 401;
        recordRequest(method, path, status, performance.now() - start, requestId);
        return errorResponse(error?.message ?? 'Unauthorized', status, 'UNAUTHORIZED');
      }

      const params = ((await routeCtx?.params) ?? {}) as P;

      const res = await handler({ req, session, params, requestId });
      recordRequest(method, path, res.status, performance.now() - start, requestId);
      return res;
    } catch (err) {
      console.error(`[${method} ${path}] handler error:`, err);
      recordRequest(method, path, 500, performance.now() - start, requestId);
      return errorResponse('Server error', 500, 'INTERNAL_ERROR');
    }
  };
}

// Re-exported for convenience so route files import auth types from one place.
export type AdminSession = Session;
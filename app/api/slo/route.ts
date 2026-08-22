import { NextRequest } from 'next/server';
import { requireAdmin } from '@/app/api/_lib/admin';
import { getRequestId, errorResponse, successResponse } from '@/lib/api';
import { recordRequest } from '@/lib/observability';
import { sloCollector, SLO } from '@/lib/slo';

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req);
  const start = performance.now();
  try {
    const { session, error } = await requireAdmin();
    if (!session) {
      recordRequest('GET', '/api/slo', error!.status, performance.now() - start, requestId);
      return errorResponse(error!.message, error!.status, 'UNAUTHORIZED');
    }

    const metrics = sloCollector.getMetrics();

    recordRequest('GET', '/api/slo', 200, performance.now() - start, requestId);
    return successResponse({
      metrics,
      slo: SLO,
      healthy: {
        availability: metrics.availability >= SLO.availability.target,
        latency: metrics.p95Ms <= SLO.latency.p95Ms && metrics.p99Ms <= SLO.latency.p99Ms,
        errorRate: metrics.errorRate <= SLO.errorRate.maxRate,
      },
    });
  } catch (error) {
    console.error('SLO fetch error:', error);
    recordRequest('GET', '/api/slo', 500, performance.now() - start, requestId);
    return errorResponse('Server error', 500, 'SLO_FETCH_ERROR');
  }
}

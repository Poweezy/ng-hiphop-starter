import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/app/api/_lib/admin';
import { sloCollector, SLO } from '@/lib/slo';
import { getRequestId, errorResponse, successResponse } from '@/lib/api';

// Internal/admin paths excluded from SLO recording (must match lib/slo.ts INTERNAL_PATHS).
const INTERNAL_PATHS = ['/api/slo', '/api/health', '/api/admin', '/api/_next'];

function isInternalPath(path: string): boolean {
  for (const prefix of INTERNAL_PATHS) {
    if (path === prefix || path.startsWith(`${prefix}/`)) return true;
  }
  return false;
}

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req);
  const start = performance.now();
  try {
    const { session } = await requireAdmin();
    if (!session) {
      if (!isInternalPath(req.nextUrl.pathname)) {
        // Only record non-internal requests to avoid self-referential inflation.
        // (401 from requireAdmin on internal paths is also skipped.)
      }
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const metrics = sloCollector.getMetrics();

    // Do NOT record the SLO endpoint itself — it would inflate error rates / p99.
    return NextResponse.json({
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
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

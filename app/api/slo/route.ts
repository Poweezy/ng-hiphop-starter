import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/app/api/_lib/admin';
import { sloCollector, SLO } from '@/lib/slo';
import { getRequestId, errorResponse, successResponse } from '@/lib/api';
import { recordRequest } from '@/lib/observability';

export async function GET(req: NextRequest) {
    const requestId = getRequestId(req);
    const start = performance.now();
    try {
        const { session } = await requireAdmin();
        if (!session) {
            recordRequest('GET', '/api/slo', 401, performance.now() - start, requestId);
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const metrics = sloCollector.getMetrics();

        recordRequest('GET', '/api/slo', 200, performance.now() - start, requestId);
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
        recordRequest('GET', '/api/slo', 500, performance.now() - start, requestId);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

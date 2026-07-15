import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/app/api/_lib/admin';
import { sloCollector, SLO } from '@/lib/slo';

export async function GET(req: NextRequest) {
    try {
        const { session } = await requireAdmin();
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const metrics = sloCollector.getMetrics();

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

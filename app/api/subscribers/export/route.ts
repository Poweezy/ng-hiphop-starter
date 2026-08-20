import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { requireAdmin } from '@/app/api/_lib/admin';
import { getRequestId, errorResponse, successResponse } from '@/lib/api';
import { recordRequest } from '@/lib/observability';

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req);
  const start = performance.now();
  try {
    const { session, error } = await requireAdmin();
    if (!session) {
      recordRequest('GET', '/api/subscribers/export', error!.status, performance.now() - start, requestId);
      return errorResponse(error!.message, error!.status, 'UNAUTHORIZED');
    }

    const { searchParams } = new URL(req.url);
    const competitionId = searchParams.get('competitionId');

    const where: Record<string, unknown> = {};
    if (competitionId) where.competitionId = competitionId;

    const subscribers = await prisma.subscriber.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        competition: {
          select: { id: true, title: true },
        },
      },
    });

    const headers = ['ID', 'Email', 'Name', 'Competition', 'Source', 'Consent Status', 'Subscription Status', 'Created At'];
    const rows = subscribers.map((s) => [
      s.id,
      s.email,
      s.name ?? '',
      s.competition.title,
      s.source,
      s.consentStatus,
      s.subscriptionStatus,
      s.createdAt.toISOString(),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');

    recordRequest('GET', '/api/subscribers/export', 200, performance.now() - start, requestId);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="subscribers${competitionId ? `-${competitionId}` : ''}.csv"`,
      },
    });
  } catch (error) {
    console.error('Subscribers export error:', error);
    recordRequest('GET', '/api/subscribers/export', 500, performance.now() - start, requestId);
    return errorResponse('Server error', 500, 'SUBSCRIBERS_EXPORT_ERROR');
  }
}

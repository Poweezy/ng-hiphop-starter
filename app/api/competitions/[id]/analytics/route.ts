import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { requireAdmin } from '@/app/api/_lib/admin';
import { getRequestId, errorResponse, successResponse } from '@/lib/api';
import { recordRequest } from '@/lib/observability';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req);
  const start = performance.now();
  const { id } = await params;
  try {
    const { session, error } = await requireAdmin();
    if (!session) {
      recordRequest('GET', `/api/competitions/${id}/analytics`, error!.status, performance.now() - start, requestId);
      return errorResponse(error!.message, error!.status, 'UNAUTHORIZED');
    }

    const competition = await prisma.lyricCompetition.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!competition) {
      recordRequest('GET', `/api/competitions/${id}/analytics`, 404, performance.now() - start, requestId);
      return errorResponse('Competition not found', 404, 'NOT_FOUND');
    }

    const analytics = await prisma.competitionAnalytics.findUnique({
      where: { competitionId: id },
    });

    const submissions = await prisma.lyricSubmission.findMany({
      where: { competitionId: id, deletedAt: null },
      select: { status: true, userId: true },
    });

    const totalSubmissions = submissions.length;
    const uniqueParticipants = new Set(submissions.map((s) => s.userId).filter(Boolean)).size;
    const approvedSubmissions = submissions.filter((s) => s.status === 'approved').length;
    const rejectedSubmissions = submissions.filter((s) => s.status === 'rejected').length;
    const winnersCount = submissions.filter((s) => s.status === 'winner').length;

    const subscribers = await prisma.subscriber.count({
      where: { competitionId: id },
    });

    const prizeValue = await prisma.competitionPrize.aggregate({
      where: { competitionId: id },
      _sum: { cashAmount: true },
    });

    const conversionRate = subscribers > 0 && totalSubmissions > 0
      ? Number(((subscribers / totalSubmissions) * 100).toFixed(2))
      : 0;

    const computed = {
      totalSubmissions,
      uniqueParticipants,
      approvedSubmissions,
      rejectedSubmissions,
      subscribersGenerated: subscribers,
      conversionRate,
      winners: winnersCount,
      prizeValue: prizeValue._sum.cashAmount != null ? prizeValue._sum.cashAmount.toNumber() : 0,
    };

    recordRequest('GET', `/api/competitions/${id}/analytics`, 200, performance.now() - start, requestId);
    return successResponse({
      ...(analytics ?? {}),
      ...computed,
    });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    recordRequest('GET', `/api/competitions/${id}/analytics`, 500, performance.now() - start, requestId);
    return errorResponse('Server error', 500, 'ANALYTICS_FETCH_ERROR');
  }
}

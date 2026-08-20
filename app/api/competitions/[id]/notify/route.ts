import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { requireAdmin } from '@/app/api/_lib/admin';
import { getRequestId, errorResponse, successResponse } from '@/lib/api';
import { recordRequest } from '@/lib/observability';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req);
  const start = performance.now();
  const { id } = await params;
  try {
    const { session, error } = await requireAdmin();
    if (!session) {
      recordRequest('POST', `/api/competitions/${id}/notify`, error!.status, performance.now() - start, requestId);
      return errorResponse(error!.message, error!.status, 'UNAUTHORIZED');
    }

    const competition = await prisma.lyricCompetition.findUnique({
      where: { id },
      select: { id: true, title: true },
    });

    if (!competition) {
      recordRequest('POST', `/api/competitions/${id}/notify`, 404, performance.now() - start, requestId);
      return errorResponse('Competition not found', 404, 'NOT_FOUND');
    }

    const subscribers = await prisma.subscriber.findMany({
      where: { competitionId: id, subscriptionStatus: 'active' },
      select: { email: true },
    });

    if (subscribers.length === 0) {
      recordRequest('POST', `/api/competitions/${id}/notify`, 200, performance.now() - start, requestId);
      return successResponse({ message: 'No subscribers to notify', notified: 0 });
    }

    const winner = await prisma.winner.findFirst({
      where: { competitionId: id },
      include: { submission: { select: { artistAlias: true, lyrics: true } } },
    });

    const message = `Competition "${competition.title}" winner announced!${winner ? ` Winning lyric by ${winner.submission?.artistAlias}: "${winner.submission?.lyrics?.substring(0, 100)}"` : ''}`;

    await prisma.subscriber.updateMany({
      where: { competitionId: id },
      data: { lastEmailSentAt: new Date() },
    });

    recordRequest('POST', `/api/competitions/${id}/notify`, 200, performance.now() - start, requestId);
    return successResponse({
      message: 'Notification queued',
      notified: subscribers.length,
      winnerAnnounced: !!winner,
    });
  } catch (error) {
    console.error('Notify error:', error);
    recordRequest('POST', `/api/competitions/${id}/notify`, 500, performance.now() - start, requestId);
    return errorResponse('Server error', 500, 'NOTIFY_ERROR');
  }
}

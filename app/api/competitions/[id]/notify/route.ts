import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { requireAdmin } from '@/app/api/_lib/admin';
import { getRequestId, errorResponse, successResponse } from '@/lib/api';
import { recordRequest } from '@/lib/observability';
import { notifyAdminModeration } from '@/lib/moderation';

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
      select: { id: true, title: true, winnerId: true },
    });

    if (!competition) {
      recordRequest('POST', `/api/competitions/${id}/notify`, 404, performance.now() - start, requestId);
      return errorResponse('Competition not found', 404, 'NOT_FOUND');
    }

    const subscribers = await prisma.competitionSubscriber.findMany({
      where: { competitionId: id },
      select: { email: true },
    });

    if (subscribers.length === 0) {
      recordRequest('POST', `/api/competitions/${id}/notify`, 200, performance.now() - start, requestId);
      return successResponse({ message: 'No subscribers to notify', notified: 0 });
    }

    const winner = competition.winnerId
      ? await prisma.lyricGame.findUnique({ where: { id: competition.winnerId }, select: { lyric_text: true, correct_artist: true } })
      : null;

    const message = `Competition "${competition.title}" winner announced!${winner ? ` Winning lyric by ${winner.correct_artist}: "${winner.lyric_text}"` : ''}`;

    await notifyAdminModeration({
      submissionType: 'competition_winner',
      submissionId: competition.id,
      submittedBy: subscribers.map(s => s.email).join(', '),
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

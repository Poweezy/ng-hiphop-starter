import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { requireAdmin } from '@/app/api/_lib/admin';
import { getRequestId, errorResponse, successResponse } from '@/lib/api';
import { recordRequest } from '@/lib/observability';
import { winnerSchema } from '@/lib/validations';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req);
  const start = performance.now();
  const { id } = await params;
  try {
    const { session, error } = await requireAdmin();
    if (!session) {
      recordRequest('POST', `/api/competitions/${id}/winner`, error!.status, performance.now() - start, requestId);
      return errorResponse(error!.message, error!.status, 'UNAUTHORIZED');
    }

    const body = await req.json();
    const parsed = winnerSchema.safeParse(body);

    if (!parsed.success) {
      recordRequest('POST', `/api/competitions/${id}/winner`, 400, performance.now() - start, requestId);
      return errorResponse('Invalid input', 400, 'VALIDATION_ERROR', parsed.error.issues);
    }

    const { winnerId } = parsed.data;

    const lyric = await prisma.lyricGame.findUnique({
      where: { id: winnerId },
      select: { id: true, competitionId: true },
    });

    if (!lyric || lyric.competitionId !== id) {
      recordRequest('POST', `/api/competitions/${id}/winner`, 400, performance.now() - start, requestId);
      return errorResponse('Invalid winnerId for this competition', 400, 'INVALID_WINNER');
    }

    const competition = await prisma.lyricCompetition.update({
      where: { id },
      data: { winnerId },
    });

    recordRequest('POST', `/api/competitions/${id}/winner`, 200, performance.now() - start, requestId);
    return successResponse(competition);
  } catch (error) {
    console.error('Declare winner error:', error);
    recordRequest('POST', `/api/competitions/${id}/winner`, 500, performance.now() - start, requestId);
    return errorResponse('Server error', 500, 'WINNER_DECLARE_ERROR');
  }
}

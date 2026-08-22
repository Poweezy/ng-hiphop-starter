import { NextRequest } from 'next/server';
import { prisma } from '@/app/db';
import { requireAdmin } from '@/app/api/_lib/admin';
import { winnerSelectionSchema } from '@/lib/validations';
import { getRequestId, errorResponse, successResponse } from '@/lib/api';
import { recordRequest } from '@/lib/observability';

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req);
  const start = performance.now();
  try {
    const { session, error } = await requireAdmin();
    if (!session) {
      recordRequest('GET', '/api/winners', error!.status, performance.now() - start, requestId);
      return errorResponse(error!.message, error!.status, 'UNAUTHORIZED');
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));
    const skip = (page - 1) * limit;
    const competitionId = searchParams.get('competitionId');

    const where: Record<string, unknown> = {};
    if (competitionId) where.competitionId = competitionId;

    const [winners, total] = await Promise.all([
      prisma.winner.findMany({
        where,
        orderBy: { position: 'asc' },
        skip,
        take: limit,
        include: {
          competition: {
            select: { id: true, title: true },
          },
          prize: true,
          submission: {
            select: {
              id: true,
              artistAlias: true,
              songTitle: true,
              lyrics: true,
            },
          },
        },
      }),
      prisma.winner.count({ where }),
    ]);

    const serialized = winners.map((w) => ({
      ...w,
      cashAmount: w.cashAmount != null ? w.cashAmount.toNumber() : null,
    }));

    recordRequest('GET', '/api/winners', 200, performance.now() - start, requestId);
    return successResponse({
      winners: serialized,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Winners fetch error:', error);
    recordRequest('GET', '/api/winners', 500, performance.now() - start, requestId);
    return errorResponse('Server error', 500, 'WINNERS_FETCH_ERROR');
  }
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req);
  const start = performance.now();
  try {
    const { session, error } = await requireAdmin();
    if (!session) {
      recordRequest('POST', '/api/winners', error!.status, performance.now() - start, requestId);
      return errorResponse(error!.message, error!.status, 'UNAUTHORIZED');
    }

    const body = await req.json();
    const validation = winnerSelectionSchema.safeParse(body);
    if (!validation.success) {
      recordRequest('POST', '/api/winners', 400, performance.now() - start, requestId);
      return errorResponse('Invalid input', 400, 'VALIDATION_ERROR', validation.error.issues);
    }

    const { competitionId, submissionId, position, prizeId } = validation.data;

    const competition = await prisma.lyricCompetition.findUnique({
      where: { id: competitionId },
    });

    if (!competition) {
      recordRequest('POST', '/api/winners', 404, performance.now() - start, requestId);
      return errorResponse('Competition not found', 404, 'NOT_FOUND');
    }

    const submission = await prisma.lyricSubmission.findUnique({
      where: { id: submissionId },
    });

    if (!submission || submission.competitionId !== competitionId) {
      recordRequest('POST', '/api/winners', 400, performance.now() - start, requestId);
      return errorResponse('Submission does not belong to this competition', 400, 'INVALID_SUBMISSION');
    }

    if (submission.status !== 'approved') {
      recordRequest('POST', '/api/winners', 400, performance.now() - start, requestId);
      return errorResponse('Submission must be approved to be selected as a winner', 400, 'SUBMISSION_NOT_APPROVED');
    }

    const existingWinner = await prisma.winner.findUnique({
      where: { competitionId_position: { competitionId, position } },
    });

    if (existingWinner) {
      recordRequest('POST', '/api/winners', 400, performance.now() - start, requestId);
      return errorResponse('A winner already exists for this position', 400, 'POSITION_TAKEN');
    }

    const prize = prizeId
      ? await prisma.competitionPrize.findUnique({ where: { id: prizeId } })
      : null;

    if (prize && prize.competitionId !== competitionId) {
      recordRequest('POST', '/api/winners', 400, performance.now() - start, requestId);
      return errorResponse('Prize does not belong to this competition', 400, 'INVALID_PRIZE');
    }

    const winner = await prisma.winner.create({
      data: {
        competitionId,
        submissionId,
        position,
        prizeId,
        prizeName: prize?.name,
        cashAmount: prize?.cashAmount,
        selectedBy: session.user.id,
      },
      include: {
        competition: { select: { id: true, title: true } },
        prize: true,
        submission: {
          select: { id: true, artistAlias: true, songTitle: true },
        },
      },
    });

    await prisma.lyricSubmission.update({
      where: { id: submissionId },
      data: { status: 'winner' },
    });

    await prisma.competitionAnalytics.upsert({
      where: { competitionId },
      update: { winners: { increment: 1 } },
      create: {
        competitionId,
        winners: 1,
      },
    });

    const serialized = {
      ...winner,
      cashAmount: winner.cashAmount != null ? winner.cashAmount.toNumber() : null,
    };

    recordRequest('POST', '/api/winners', 201, performance.now() - start, requestId);
    return successResponse(serialized, 201);
  } catch (error) {
    console.error('Winner selection error:', error);
    recordRequest('POST', '/api/winners', 500, performance.now() - start, requestId);
    return errorResponse('Server error', 500, 'WINNER_SELECTION_ERROR');
  }
}

import { NextRequest } from 'next/server';
import { prisma } from '@/app/db';
import { requireAdmin } from '@/app/api/_lib/admin';
import { competitionPrizeSchema } from '@/lib/validations';
import { getRequestId, errorResponse, successResponse } from '@/lib/api';
import { recordRequest } from '@/lib/observability';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req);
  const start = performance.now();
  const { id } = await params;
  try {
    const { session, error } = await requireAdmin();
    if (!session) {
      recordRequest('GET', `/api/competitions/${id}/prizes`, error!.status, performance.now() - start, requestId);
      return errorResponse(error!.message, error!.status, 'UNAUTHORIZED');
    }

    const prizes = await prisma.competitionPrize.findMany({
      where: { competitionId: id },
      orderBy: { position: 'asc' },
    });

    const serialized = prizes.map((p) => ({
      ...p,
      cashAmount: p.cashAmount != null ? p.cashAmount.toNumber() : null,
    }));

    recordRequest('GET', `/api/competitions/${id}/prizes`, 200, performance.now() - start, requestId);
    return successResponse(serialized);
  } catch (error) {
    console.error('Prizes fetch error:', error);
    recordRequest('GET', `/api/competitions/${id}/prizes`, 500, performance.now() - start, requestId);
    return errorResponse('Server error', 500, 'PRIZES_FETCH_ERROR');
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req);
  const start = performance.now();
  const { id } = await params;
  try {
    const { session, error } = await requireAdmin();
    if (!session) {
      recordRequest('POST', `/api/competitions/${id}/prizes`, error!.status, performance.now() - start, requestId);
      return errorResponse(error!.message, error!.status, 'UNAUTHORIZED');
    }

    const body = await req.json();
    const validation = competitionPrizeSchema.safeParse(body);
    if (!validation.success) {
      recordRequest('POST', `/api/competitions/${id}/prizes`, 400, performance.now() - start, requestId);
      return errorResponse('Invalid input', 400, 'VALIDATION_ERROR', validation.error.issues);
    }

    const { position, name, cashAmount, description } = validation.data;

    const prize = await prisma.competitionPrize.create({
      data: {
        competitionId: id,
        position,
        name,
        cashAmount: cashAmount != null ? cashAmount : undefined,
        description,
      },
    });

    const serialized = {
      ...prize,
      cashAmount: prize.cashAmount != null ? prize.cashAmount.toNumber() : null,
    };

    recordRequest('POST', `/api/competitions/${id}/prizes`, 201, performance.now() - start, requestId);
    return successResponse(serialized, 201);
  } catch (error) {
    console.error('Prize create error:', error);
    recordRequest('POST', `/api/competitions/${id}/prizes`, 500, performance.now() - start, requestId);
    return errorResponse('Server error', 500, 'PRIZE_CREATE_ERROR');
  }
}

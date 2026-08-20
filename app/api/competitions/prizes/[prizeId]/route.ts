import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { requireAdmin } from '@/app/api/_lib/admin';
import { getRequestId, errorResponse, successResponse } from '@/lib/api';
import { recordRequest } from '@/lib/observability';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ prizeId: string }> }) {
  const requestId = getRequestId(req);
  const start = performance.now();
  const { prizeId } = await params;
  try {
    const { session, error } = await requireAdmin();
    if (!session) {
      recordRequest('PATCH', `/api/competitions/prizes/${prizeId}`, error!.status, performance.now() - start, requestId);
      return errorResponse(error!.message, error!.status, 'UNAUTHORIZED');
    }

    const body = await req.json();
    const { name, position, cashAmount, description } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (position !== undefined) updateData.position = position;
    if (cashAmount !== undefined) updateData.cashAmount = cashAmount != null ? cashAmount : undefined;
    if (description !== undefined) updateData.description = description;

    const prize = await prisma.competitionPrize.update({
      where: { id: prizeId },
      data: updateData,
    });

    const serialized = {
      ...prize,
      cashAmount: prize.cashAmount != null ? prize.cashAmount.toNumber() : null,
    };

    recordRequest('PATCH', `/api/competitions/prizes/${prizeId}`, 200, performance.now() - start, requestId);
    return successResponse(serialized);
  } catch (error) {
    console.error('Prize update error:', error);
    recordRequest('PATCH', `/api/competitions/prizes/${prizeId}`, 500, performance.now() - start, requestId);
    return errorResponse('Server error', 500, 'PRIZE_UPDATE_ERROR');
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ prizeId: string }> }) {
  const requestId = getRequestId(req);
  const start = performance.now();
  const { prizeId } = await params;
  try {
    const { session, error } = await requireAdmin();
    if (!session) {
      recordRequest('DELETE', `/api/competitions/prizes/${prizeId}`, error!.status, performance.now() - start, requestId);
      return errorResponse(error!.message, error!.status, 'UNAUTHORIZED');
    }

    await prisma.competitionPrize.delete({ where: { id: prizeId } });
    recordRequest('DELETE', `/api/competitions/prizes/${prizeId}`, 204, performance.now() - start, requestId);
    return NextResponse.json(null, { status: 204 });
  } catch (error) {
    console.error('Prize delete error:', error);
    recordRequest('DELETE', `/api/competitions/prizes/${prizeId}`, 500, performance.now() - start, requestId);
    return errorResponse('Server error', 500, 'PRIZE_DELETE_ERROR');
  }
}

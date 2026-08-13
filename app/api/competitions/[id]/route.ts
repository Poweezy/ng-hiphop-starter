import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { requireAdmin } from '@/app/api/_lib/admin';
import { competitionUpdateSchema } from '@/lib/validations';
import { getRequestId, errorResponse, successResponse } from '@/lib/api';
import { recordRequest } from '@/lib/observability';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req);
  const start = performance.now();
  const { id } = await params;
  try {
    const { session, error } = await requireAdmin();
    if (!session) {
      recordRequest('PATCH', `/api/competitions/${id}`, error!.status, performance.now() - start, requestId);
      return errorResponse(error!.message, error!.status, 'UNAUTHORIZED');
    }

    const body = await req.json();
    const validation = competitionUpdateSchema.safeParse(body);
    if (!validation.success) {
      recordRequest('PATCH', `/api/competitions/${id}`, 400, performance.now() - start, requestId);
      return errorResponse('Invalid input', 400, 'VALIDATION_ERROR', validation.error.issues);
    }

    const { title, period, startDate, endDate, is_active, winnerId } = validation.data;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (period !== undefined) updateData.period = period;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (is_active !== undefined) updateData.is_active = is_active;
    if (winnerId !== undefined) updateData.winnerId = winnerId;

    const competition = await prisma.lyricCompetition.update({
      where: { id },
      data: updateData,
    });

    recordRequest('PATCH', `/api/competitions/${id}`, 200, performance.now() - start, requestId);
    return successResponse(competition);
  } catch (error) {
    console.error('Competition update error:', error);
    recordRequest('PATCH', `/api/competitions/${id}`, 500, performance.now() - start, requestId);
    return errorResponse('Server error', 500, 'COMPETITION_UPDATE_ERROR');
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req);
  const start = performance.now();
  const { id } = await params;
  try {
    const { session, error } = await requireAdmin();
    if (!session) {
      recordRequest('DELETE', `/api/competitions/${id}`, error!.status, performance.now() - start, requestId);
      return errorResponse(error!.message, error!.status, 'UNAUTHORIZED');
    }

    await prisma.lyricCompetition.delete({ where: { id } });
    recordRequest('DELETE', `/api/competitions/${id}`, 204, performance.now() - start, requestId);
    return NextResponse.json(null, { status: 204 });
  } catch (error) {
    console.error('Competition delete error:', error);
    recordRequest('DELETE', `/api/competitions/${id}`, 500, performance.now() - start, requestId);
    return errorResponse('Server error', 500, 'COMPETITION_DELETE_ERROR');
  }
}

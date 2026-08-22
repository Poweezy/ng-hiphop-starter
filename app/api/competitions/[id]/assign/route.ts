import { NextRequest } from 'next/server';
import { prisma } from '@/app/db';
import { requireAdmin } from '@/app/api/_lib/admin';
import { competitionAssignSchema } from '@/lib/validations';
import { getRequestId, errorResponse, successResponse } from '@/lib/api';
import { recordRequest } from '@/lib/observability';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req);
  const start = performance.now();
  const { id } = await params;
  try {
    const { session, error } = await requireAdmin();
    if (!session) {
      recordRequest('POST', `/api/competitions/${id}/assign`, error!.status, performance.now() - start, requestId);
      return errorResponse(error!.message, error!.status, 'UNAUTHORIZED');
    }

    const body = await req.json();
    const validation = competitionAssignSchema.safeParse(body);
    if (!validation.success) {
      recordRequest('POST', `/api/competitions/${id}/assign`, 400, performance.now() - start, requestId);
      return errorResponse('Invalid input', 400, 'VALIDATION_ERROR', validation.error.issues);
    }

    const { lyricIds } = validation.data;

    const competition = await prisma.lyricCompetition.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!competition) {
      recordRequest('POST', `/api/competitions/${id}/assign`, 404, performance.now() - start, requestId);
      return errorResponse('Competition not found', 404, 'NOT_FOUND');
    }

    const updated = await prisma.lyricGame.updateMany({
      where: {
        id: { in: lyricIds },
      },
      data: {
        competitionId: id,
      },
    });

    recordRequest('POST', `/api/competitions/${id}/assign`, 200, performance.now() - start, requestId);
    return successResponse({
      message: 'Lyrics assigned to competition',
      assignedCount: updated.count,
    });
  } catch (error) {
    console.error('Assign lyrics error:', error);
    recordRequest('POST', `/api/competitions/${id}/assign`, 500, performance.now() - start, requestId);
    return errorResponse('Server error', 500, 'ASSIGN_ERROR');
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { requireAdmin } from '@/app/api/_lib/admin';
import { competitionUpdateSchema } from '@/lib/validations';
import { getRequestId, errorResponse, successResponse } from '@/lib/api';
import { recordRequest } from '@/lib/observability';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req);
  const start = performance.now();
  const { id } = await params;
  try {
    const { session, error } = await requireAdmin();
    if (!session) {
      recordRequest('GET', `/api/competitions/${id}`, error!.status, performance.now() - start, requestId);
      return errorResponse(error!.message, error!.status, 'UNAUTHORIZED');
    }

    const competition = await prisma.lyricCompetition.findUnique({
      where: { id },
      include: {
        rules: true,
        prizes: true,
        analytics: true,
        winners: {
          include: {
            prize: true,
            submission: {
              select: {
                id: true,
                artistAlias: true,
                songTitle: true,
                status: true,
              },
            },
          },
        },
        _count: {
          select: {
            submissions: true,
            subscribers: true,
            participants: true,
          },
        },
      },
    });

    if (!competition) {
      recordRequest('GET', `/api/competitions/${id}`, 404, performance.now() - start, requestId);
      return errorResponse('Competition not found', 404, 'NOT_FOUND');
    }

    recordRequest('GET', `/api/competitions/${id}`, 200, performance.now() - start, requestId);
    return successResponse(competition);
  } catch (error) {
    console.error('Competition fetch error:', error);
    recordRequest('GET', `/api/competitions/${id}`, 500, performance.now() - start, requestId);
    return errorResponse('Server error', 500, 'COMPETITION_FETCH_ERROR');
  }
}

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

    const data = validation.data;
    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
    if (data.submissionDeadline !== undefined) updateData.submissionDeadline = new Date(data.submissionDeadline);
    if (data.bannerUrl !== undefined) updateData.bannerUrl = data.bannerUrl;
    if (data.shortDescription !== undefined) updateData.shortDescription = data.shortDescription;
    if (data.socialSharingText !== undefined) updateData.socialSharingText = data.socialSharingText;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;

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

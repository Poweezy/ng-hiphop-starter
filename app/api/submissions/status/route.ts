import { NextRequest } from 'next/server';
import { prisma } from '@/app/db';
import { getRequestId, errorResponse, successResponse } from '@/lib/api';
import { recordRequest } from '@/lib/observability';

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req);
  const start = performance.now();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const alias = searchParams.get('alias');

  try {
    if (!id && !alias) {
      recordRequest('GET', '/api/submissions/status', 400, performance.now() - start, requestId);
      return errorResponse('Provide id or alias', 400, 'MISSING_QUERY');
    }

    const submission = await prisma.lyricSubmission.findFirst({
      where: {
        ...(id ? { id } : {}),
        ...(alias ? { artistAlias: alias } : {}),
        deletedAt: null,
      },
      select: {
        id: true,
        artistAlias: true,
        status: true,
        moderationStatus: true,
        moderationReason: true,
        moderationNotes: true,
        createdAt: true,
        updatedAt: true,
        competition: {
          select: { id: true, title: true, endDate: true },
        },
      },
    });

    if (!submission) {
      recordRequest('GET', '/api/submissions/status', 404, performance.now() - start, requestId);
      return errorResponse('Submission not found', 404, 'NOT_FOUND');
    }

    recordRequest('GET', '/api/submissions/status', 200, performance.now() - start, requestId);
    return successResponse({
      id: submission.id,
      artistAlias: submission.artistAlias,
      status: submission.status,
      moderationStatus: submission.moderationStatus,
      moderationReason: submission.moderationReason,
      moderationNotes: submission.moderationNotes,
      submittedAt: submission.createdAt.toISOString(),
      updatedAt: submission.updatedAt.toISOString(),
      competition: submission.competition,
    });
  } catch (error) {
    console.error('Submission status fetch error:', error);
    recordRequest('GET', '/api/submissions/status', 500, performance.now() - start, requestId);
    return errorResponse('Server error', 500, 'SUBMISSION_STATUS_ERROR');
  }
}

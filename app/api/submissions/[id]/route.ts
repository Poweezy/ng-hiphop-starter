import { NextRequest } from 'next/server';
import { prisma } from '@/app/db';
import { requireAdmin } from '@/app/api/_lib/admin';
import { getRequestId, errorResponse, successResponse } from '@/lib/api';
import { recordRequest } from '@/lib/observability';
import { submissionUpdateSchema } from '@/lib/validations';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req);
  const start = performance.now();
  const { id } = await params;
  try {
    const { session, error } = await requireAdmin();
    if (!session) {
      recordRequest('GET', `/api/submissions/${id}`, error!.status, performance.now() - start, requestId);
      return errorResponse(error!.message, error!.status, 'UNAUTHORIZED');
    }

    const submission = await prisma.lyricSubmission.findUnique({
      where: { id },
      include: {
        competition: {
          select: { id: true, title: true },
        },
        moderationHistory: true,
        winners: true,
      },
    });

    if (!submission) {
      recordRequest('GET', `/api/submissions/${id}`, 404, performance.now() - start, requestId);
      return errorResponse('Submission not found', 404, 'NOT_FOUND');
    }

    recordRequest('GET', `/api/submissions/${id}`, 200, performance.now() - start, requestId);
    return successResponse(submission);
  } catch (error) {
    console.error('Submission fetch error:', error);
    recordRequest('GET', `/api/submissions/${id}`, 500, performance.now() - start, requestId);
    return errorResponse('Server error', 500, 'SUBMISSION_FETCH_ERROR');
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req);
  const start = performance.now();
  const { id } = await params;
  try {
    const { session, error } = await requireAdmin();
    if (!session) {
      recordRequest('PATCH', `/api/submissions/${id}`, error!.status, performance.now() - start, requestId);
      return errorResponse(error!.message, error!.status, 'UNAUTHORIZED');
    }

    const body = await req.json();
    const validation = submissionUpdateSchema.safeParse(body);
    if (!validation.success) {
      recordRequest('PATCH', `/api/submissions/${id}`, 400, performance.now() - start, requestId);
      return errorResponse('Invalid input', 400, 'VALIDATION_ERROR', validation.error.issues);
    }

    const { status, score, moderationStatus, moderationNotes, moderationReason } = validation.data;

    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status;
    if (score !== undefined) updateData.score = score;
    if (moderationStatus !== undefined) updateData.moderationStatus = moderationStatus;
    if (moderationNotes !== undefined) updateData.moderationNotes = moderationNotes;
    if (moderationReason !== undefined) updateData.moderationReason = moderationReason;

    const submission = await prisma.lyricSubmission.update({
      where: { id },
      data: updateData,
    });

    recordRequest('PATCH', `/api/submissions/${id}`, 200, performance.now() - start, requestId);
    return successResponse(submission);
  } catch (error) {
    console.error('Submission update error:', error);
    recordRequest('PATCH', `/api/submissions/${id}`, 500, performance.now() - start, requestId);
    return errorResponse('Server error', 500, 'SUBMISSION_UPDATE_ERROR');
  }
}

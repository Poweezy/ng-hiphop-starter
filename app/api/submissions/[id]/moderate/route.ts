import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { requireAdmin } from '@/app/api/_lib/admin';
import { submissionModerationSchema } from '@/lib/validations';
import { getRequestId, errorResponse, successResponse } from '@/lib/api';
import { recordRequest } from '@/lib/observability';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req);
  const start = performance.now();
  const { id } = await params;
  try {
    const { session, error } = await requireAdmin();
    if (!session) {
      recordRequest('POST', `/api/submissions/${id}/moderate`, error!.status, performance.now() - start, requestId);
      return errorResponse(error!.message, error!.status, 'UNAUTHORIZED');
    }

    const body = await req.json();
    const validation = submissionModerationSchema.safeParse(body);
    if (!validation.success) {
      recordRequest('POST', `/api/submissions/${id}/moderate`, 400, performance.now() - start, requestId);
      return errorResponse('Invalid input', 400, 'VALIDATION_ERROR', validation.error.issues);
    }

    const { action, reason, notes } = validation.data;

    const submission = await prisma.lyricSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      recordRequest('POST', `/api/submissions/${id}/moderate`, 404, performance.now() - start, requestId);
      return errorResponse('Submission not found', 404, 'NOT_FOUND');
    }

    const moderationStatusMap: Record<string, string> = {
      approve: 'approved',
      reject: 'rejected',
      request_changes: 'changes_requested',
      disqualify: 'rejected',
    };

    const updatedSubmission = await prisma.lyricSubmission.update({
      where: { id },
      data: {
        moderationStatus: moderationStatusMap[action] || submission.moderationStatus,
        moderationNotes: notes,
        moderationReason: reason,
        ...(action === 'approve' ? { status: 'approved' } : {}),
        ...(action === 'reject' ? { status: 'rejected' } : {}),
        ...(action === 'disqualify' ? { status: 'disqualified' } : {}),
      },
    });

    await prisma.submissionModeration.create({
      data: {
        submissionId: id,
        action,
        reason,
        notes,
        moderatedBy: session.user.id,
      },
    });

    recordRequest('POST', `/api/submissions/${id}/moderate`, 200, performance.now() - start, requestId);
    return successResponse(updatedSubmission);
  } catch (error) {
    console.error('Moderation error:', error);
    recordRequest('POST', `/api/submissions/${id}/moderate`, 500, performance.now() - start, requestId);
    return errorResponse('Server error', 500, 'MODERATION_ERROR');
  }
}

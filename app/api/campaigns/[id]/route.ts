import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { requireAdmin } from '@/app/api/_lib/admin';
import { getRequestId, errorResponse, successResponse } from '@/lib/api';
import { recordRequest } from '@/lib/observability';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req);
  const start = performance.now();
  const { id } = await params;
  try {
    const { session, error } = await requireAdmin();
    if (!session) {
      recordRequest('PATCH', `/api/campaigns/${id}`, error!.status, performance.now() - start, requestId);
      return errorResponse(error!.message, error!.status, 'UNAUTHORIZED');
    }

    const body = await req.json();
    const { name, subject, body: campaignBody, recipientFilter, recipientIds, scheduledAt, status } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (subject !== undefined) updateData.subject = subject;
    if (campaignBody !== undefined) updateData.body = campaignBody;
    if (recipientFilter !== undefined) updateData.recipientFilter = recipientFilter;
    if (recipientIds !== undefined) updateData.recipientIds = recipientIds;
    if (scheduledAt !== undefined) updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    if (status !== undefined) updateData.status = status;

    const campaign = await prisma.emailCampaign.update({
      where: { id },
      data: updateData,
    });

    recordRequest('PATCH', `/api/campaigns/${id}`, 200, performance.now() - start, requestId);
    return successResponse(campaign);
  } catch (error) {
    console.error('Campaign update error:', error);
    recordRequest('PATCH', `/api/campaigns/${id}`, 500, performance.now() - start, requestId);
    return errorResponse('Server error', 500, 'CAMPAIGN_UPDATE_ERROR');
  }
}

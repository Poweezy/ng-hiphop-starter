import { NextRequest } from 'next/server';
import { prisma } from '@/app/db';
import { requireAdmin } from '@/app/api/_lib/admin';
import { enqueue } from '@/lib/queue';
import { getRequestId, errorResponse, successResponse } from '@/lib/api';
import { recordRequest } from '@/lib/observability';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req);
  const start = performance.now();
  const { id } = await params;
  try {
    const { session, error } = await requireAdmin();
    if (!session) {
      recordRequest('POST', `/api/campaigns/${id}/send`, error!.status, performance.now() - start, requestId);
      return errorResponse(error!.message, error!.status, 'UNAUTHORIZED');
    }

    const campaign = await prisma.emailCampaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      recordRequest('POST', `/api/campaigns/${id}/send`, 404, performance.now() - start, requestId);
      return errorResponse('Campaign not found', 404, 'NOT_FOUND');
    }

    let recipientIds: string[] = [];
    if (campaign.recipientIds) {
      try {
        recipientIds = JSON.parse(campaign.recipientIds);
      } catch {
        recipientIds = [];
      }
    }

    if (recipientIds.length === 0 && campaign.recipientFilter) {
      const where: Record<string, unknown> = {};
      try {
        const filter = JSON.parse(campaign.recipientFilter);
        if (filter.competitionId) where.competitionId = filter.competitionId;
        if (filter.subscriptionStatus) where.subscriptionStatus = filter.subscriptionStatus;
        if (filter.source) where.source = filter.source;
      } catch {
        // ignore parse errors
      }

      const subscribers = await prisma.subscriber.findMany({
        where,
        select: { id: true },
      });
      recipientIds = subscribers.map((s) => s.id);
    }

    await prisma.emailCampaign.update({
      where: { id },
      data: {
        status: 'sending',
        sentAt: new Date(),
      },
    });

    const BATCH_SIZE = 100;
    for (let i = 0; i < recipientIds.length; i += BATCH_SIZE) {
      const batch = recipientIds.slice(i, i + BATCH_SIZE);
      await enqueue('campaign.send_email', {
        campaignId: id,
        recipientIds: batch,
        subject: campaign.subject,
        body: campaign.body,
      });
    }

    recordRequest('POST', `/api/campaigns/${id}/send`, 200, performance.now() - start, requestId);
    return successResponse({
      message: 'Campaign queued for sending',
      recipientCount: recipientIds.length,
    });
  } catch (error) {
    console.error('Campaign send error:', error);
    recordRequest('POST', `/api/campaigns/${id}/send`, 500, performance.now() - start, requestId);
    return errorResponse('Server error', 500, 'CAMPAIGN_SEND_ERROR');
  }
}

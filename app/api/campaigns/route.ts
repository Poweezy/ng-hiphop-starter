import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { requireAdmin } from '@/app/api/_lib/admin';
import { emailCampaignSchema } from '@/lib/validations';
import { getRequestId, errorResponse, successResponse } from '@/lib/api';
import { recordRequest } from '@/lib/observability';

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req);
  const start = performance.now();
  try {
    const { session, error } = await requireAdmin();
    if (!session) {
      recordRequest('GET', '/api/campaigns', error!.status, performance.now() - start, requestId);
      return errorResponse(error!.message, error!.status, 'UNAUTHORIZED');
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));
    const skip = (page - 1) * limit;

    const [campaigns, total] = await Promise.all([
      prisma.emailCampaign.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.emailCampaign.count(),
    ]);

    recordRequest('GET', '/api/campaigns', 200, performance.now() - start, requestId);
    return successResponse({
      campaigns,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Campaigns fetch error:', error);
    recordRequest('GET', '/api/campaigns', 500, performance.now() - start, requestId);
    return errorResponse('Server error', 500, 'CAMPAIGNS_FETCH_ERROR');
  }
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req);
  const start = performance.now();
  try {
    const { session, error } = await requireAdmin();
    if (!session) {
      recordRequest('POST', '/api/campaigns', error!.status, performance.now() - start, requestId);
      return errorResponse(error!.message, error!.status, 'UNAUTHORIZED');
    }

    const body = await req.json();
    const validation = emailCampaignSchema.safeParse(body);
    if (!validation.success) {
      recordRequest('POST', '/api/campaigns', 400, performance.now() - start, requestId);
      return errorResponse('Invalid input', 400, 'VALIDATION_ERROR', validation.error.issues);
    }

    const data = validation.data;

    const campaign = await prisma.emailCampaign.create({
      data: {
        name: data.name,
        subject: data.subject,
        body: data.body,
        recipientFilter: data.recipientFilter,
        recipientIds: data.recipientIds,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        status: data.status,
        createdBy: session.user.id,
      },
    });

    recordRequest('POST', '/api/campaigns', 201, performance.now() - start, requestId);
    return successResponse(campaign, 201);
  } catch (error) {
    console.error('Campaign create error:', error);
    recordRequest('POST', '/api/campaigns', 500, performance.now() - start, requestId);
    return errorResponse('Server error', 500, 'CAMPAIGN_CREATE_ERROR');
  }
}

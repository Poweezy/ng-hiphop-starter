import { NextRequest } from 'next/server';
import { prisma } from '@/app/db';
import { withAdmin } from '@/app/api/_lib/withAdmin';
import { emailCampaignSchema } from '@/lib/validations';
import { errorResponse, successResponse } from '@/lib/api';

export const GET = withAdmin(async ({ req }) => {
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

  return successResponse({
    campaigns,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const POST = withAdmin(async ({ req, session }) => {
  const body = await req.json();
  const validation = emailCampaignSchema.safeParse(body);
  if (!validation.success) {
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

  return successResponse(campaign, 201);
});

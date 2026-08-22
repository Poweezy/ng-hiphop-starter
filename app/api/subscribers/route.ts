import { NextRequest } from 'next/server';
import { prisma } from '@/app/db';
import { requireAdmin } from '@/app/api/_lib/admin';
import { subscriberSchema } from '@/lib/validations';
import { getRequestId, errorResponse, successResponse } from '@/lib/api';
import { recordRequest } from '@/lib/observability';

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req);
  const start = performance.now();
  try {
    const { session, error } = await requireAdmin();
    if (!session) {
      recordRequest('GET', '/api/subscribers', error!.status, performance.now() - start, requestId);
      return errorResponse(error!.message, error!.status, 'UNAUTHORIZED');
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));
    const skip = (page - 1) * limit;
    const competitionId = searchParams.get('competitionId');
    const status = searchParams.get('status');
    const source = searchParams.get('source');

    const where: Record<string, unknown> = {};
    if (competitionId) where.competitionId = competitionId;
    if (status) where.subscriptionStatus = status;
    if (source) where.source = source;

    const [subscribers, total] = await Promise.all([
      prisma.subscriber.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          competition: {
            select: { id: true, title: true },
          },
        },
      }),
      prisma.subscriber.count({ where }),
    ]);

    recordRequest('GET', '/api/subscribers', 200, performance.now() - start, requestId);
    return successResponse({
      subscribers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Subscribers fetch error:', error);
    recordRequest('GET', '/api/subscribers', 500, performance.now() - start, requestId);
    return errorResponse('Server error', 500, 'SUBSCRIBERS_FETCH_ERROR');
  }
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req);
  const start = performance.now();
  try {
    const body = await req.json();
    const validation = subscriberSchema.safeParse(body);
    if (!validation.success) {
      recordRequest('POST', '/api/subscribers', 400, performance.now() - start, requestId);
      return errorResponse('Invalid input', 400, 'VALIDATION_ERROR', validation.error.issues);
    }

    const { competitionId, email, name, source, consentStatus, subscriptionStatus } = validation.data;

    const competition = await prisma.lyricCompetition.findUnique({
      where: { id: competitionId },
    });

    if (!competition) {
      recordRequest('POST', '/api/subscribers', 404, performance.now() - start, requestId);
      return errorResponse('Competition not found', 404, 'NOT_FOUND');
    }

    const subscriber = await prisma.subscriber.upsert({
      where: {
        competitionId_email: {
          competitionId,
          email,
        },
      },
      update: {},
      create: {
        competitionId,
        email,
        name,
        source,
        consentStatus,
        subscriptionStatus,
      },
    });

    await prisma.competitionAnalytics.upsert({
      where: { competitionId },
      update: { subscribersGenerated: { increment: 1 } },
      create: {
        competitionId,
        subscribersGenerated: 1,
      },
    });

    recordRequest('POST', '/api/subscribers', 201, performance.now() - start, requestId);
    return successResponse(subscriber, 201);
  } catch (error) {
    console.error('Subscriber create error:', error);
    recordRequest('POST', '/api/subscribers', 500, performance.now() - start, requestId);
    return errorResponse('Server error', 500, 'SUBSCRIBER_CREATE_ERROR');
  }
}

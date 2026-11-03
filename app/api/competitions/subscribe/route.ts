import { NextRequest } from 'next/server';
import { prisma } from '@/app/db';
import { competitionSubscribeSchema } from '@/lib/validations';
import { getClientIp } from '@/lib/ip';
import { checkRateLimit } from '@/lib/ratelimit';
import { getRequestId, errorResponse, successResponse } from '@/lib/api';
import { recordRequest } from '@/lib/observability';
import { requestSubscriberConsent } from '@/lib/subscriber-consent';

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req);
  const start = performance.now();
  try {
    const ip = getClientIp(req);
    const key = `subscribe:${ip}`;
    const { allowed } = await checkRateLimit({ key, max: 3, periodSeconds: 60 });
    if (!allowed) {
      recordRequest('POST', '/api/competitions/subscribe', 429, performance.now() - start, requestId);
      return errorResponse('Too many requests. Please wait.', 429, 'RATE_LIMIT_EXCEEDED');
    }

    const body = await req.json();
    const validation = competitionSubscribeSchema.safeParse(body);
    if (!validation.success) {
      recordRequest('POST', '/api/competitions/subscribe', 400, performance.now() - start, requestId);
      return errorResponse('Invalid input', 400, 'VALIDATION_ERROR', validation.error.issues);
    }

    const { competitionId, email, name, source } = validation.data;

    const competition = await prisma.lyricCompetition.findUnique({
      where: { id: competitionId },
    });

    if (!competition) {
      recordRequest('POST', '/api/competitions/subscribe', 404, performance.now() - start, requestId);
      return errorResponse('Competition not found', 404, 'NOT_FOUND');
    }

    const subscription = await requestSubscriberConsent({
      competitionId,
      email,
      name,
      source,
    });

    if (subscription.created) {
      await prisma.competitionAnalytics.upsert({
        where: { competitionId },
        update: { subscribersGenerated: { increment: 1 } },
        create: {
          competitionId,
          subscribersGenerated: 1,
        },
      });
    }

    recordRequest('POST', '/api/competitions/subscribe', 202, performance.now() - start, requestId);
    return successResponse({
      message: "If this address can be subscribed, you'll receive an email with next steps.",
    }, 202);
  } catch (error) {
    console.error('Subscribe error:', error);
    recordRequest('POST', '/api/competitions/subscribe', 500, performance.now() - start, requestId);
    return errorResponse('Server error', 500, 'SUBSCRIBE_ERROR');
  }
}

import { NextRequest } from 'next/server';
import { prisma } from '@/app/db';
import { competitionSubscribeSchema } from '@/lib/validations';
import { getClientIp } from '@/lib/ip';
import { checkRateLimit } from '@/lib/ratelimit';
import { getRequestId, errorResponse, successResponse } from '@/lib/api';
import { recordRequest } from '@/lib/observability';

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

    const { competitionId, email } = validation.data;

    const competition = await prisma.lyricCompetition.findUnique({
      where: { id: competitionId },
    });

    if (!competition) {
      recordRequest('POST', '/api/competitions/subscribe', 404, performance.now() - start, requestId);
      return errorResponse('Competition not found', 404, 'NOT_FOUND');
    }

    await prisma.subscriber.upsert({
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
        source: 'Best Lyrics Portal',
      },
    });

    recordRequest('POST', '/api/competitions/subscribe', 201, performance.now() - start, requestId);
    return successResponse({ message: "Subscribed! You'll be notified when the winner is announced." }, 201);
  } catch (error) {
    console.error('Subscribe error:', error);
    recordRequest('POST', '/api/competitions/subscribe', 500, performance.now() - start, requestId);
    return errorResponse('Server error', 500, 'SUBSCRIBE_ERROR');
  }
}

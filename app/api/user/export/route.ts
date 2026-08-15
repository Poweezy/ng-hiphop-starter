import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/app/db';
import { getRequestId, errorResponse } from '@/lib/api';
import { recordRequest } from '@/lib/observability';
import { checkRateLimit } from '@/lib/ratelimit';
import { getClientIp } from '@/lib/ip';

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req);
  const start = performance.now();
  try {
    const session = await auth();
    if (!session?.user?.email) {
      recordRequest('GET', '/api/user/export', 401, performance.now() - start, requestId);
      return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
    }

    // Rate limit per authenticated user — prevent bulk exfiltration
    const ip = getClientIp(req);
    const rateKey = `export:${session.user.email}:${ip}`;
    const { allowed } = await checkRateLimit({ key: rateKey, max: 10, periodSeconds: 60 });
    if (!allowed) {
      recordRequest('GET', '/api/user/export', 429, performance.now() - start, requestId);
      return errorResponse('Too many export requests. Please wait.', 429, 'RATE_LIMIT_EXCEEDED');
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      recordRequest('GET', '/api/user/export', 404, performance.now() - start, requestId);
      return errorResponse('User not found', 404, 'USER_NOT_FOUND');
    }

    // Scope lyrics to competitions the requesting user subscribed to,
    // since LyricGame has no submitted_by field.
    const subscribedCompetitions = await prisma.competitionSubscriber.findMany({
      where: { email: session.user.email },
      select: { competitionId: true },
    });
    const subscribedIds = subscribedCompetitions.map(s => s.competitionId);

    const [quotes, lyrics, graffiti] = await Promise.all([
      prisma.quoteSubmission.findMany({ where: { submitted_by: session.user.email } }),
      prisma.lyricGame.findMany({
        where: subscribedIds.length > 0
          ? { competitionId: { in: subscribedIds } }
          : { id: { in: [] } },
      }),
      prisma.graffitiSubmission.findMany({ where: { artist_name: session.user.email } }),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      account: user,
      submissions: {
        quotes,
        lyrics,
        graffiti,
      },
    };

    recordRequest('GET', '/api/user/export', 200, performance.now() - start, requestId);
    return NextResponse.json(exportData);
  } catch (error) {
    console.error('Data export error:', error);
    recordRequest('GET', '/api/user/export', 500, performance.now() - start, requestId);
    return errorResponse('Server error', 500, 'EXPORT_ERROR');
  }
}

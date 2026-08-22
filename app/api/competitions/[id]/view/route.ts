import { NextRequest } from 'next/server';
import { prisma } from '@/app/db';
import { getClientIp } from '@/lib/ip';
import { checkRateLimit } from '@/lib/ratelimit';
import { getRequestId, errorResponse, successResponse } from '@/lib/api';
import { recordRequest } from '@/lib/observability';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req);
  const start = performance.now();
  const { id } = await params;
  try {
    const ip = getClientIp(req);
    const key = `view:${id}:${ip}`;
    const { allowed } = await checkRateLimit({ key, max: 30, periodSeconds: 60 });
    if (!allowed) {
      recordRequest('POST', `/api/competitions/${id}/view`, 429, performance.now() - start, requestId);
      return errorResponse('Too many requests. Please wait.', 429, 'RATE_LIMIT_EXCEEDED');
    }

    const competition = await prisma.lyricCompetition.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    await prisma.competitionAnalytics.upsert({
      where: { competitionId: id },
      update: { views: { increment: 1 } },
      create: {
        competitionId: id,
        views: 1,
      },
    });

    recordRequest('POST', `/api/competitions/${id}/view`, 200, performance.now() - start, requestId);
    return successResponse({ viewCount: competition.viewCount });
  } catch (error) {
    console.error('View error:', error);
    recordRequest('POST', `/api/competitions/${id}/view`, 500, performance.now() - start, requestId);
    return errorResponse('Server error', 500, 'VIEW_ERROR');
  }
}

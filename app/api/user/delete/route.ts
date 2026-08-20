import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/app/db';
import { getRequestId, errorResponse, successResponse } from '@/lib/api';
import { recordRequest } from '@/lib/observability';
import { checkUserRateLimit } from '@/lib/ratelimit';

export async function DELETE(req: NextRequest) {
  const requestId = getRequestId(req);
  const start = performance.now();
  try {
    const session = await auth();
    if (!session?.user?.email) {
      recordRequest('DELETE', '/api/user/delete', 401, performance.now() - start, requestId);
      return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
    }

    // Rate limit: max 3 deletion attempts per user per minute.
    const rateLimit = await checkUserRateLimit(session.user.email, 'delete', 3, 60);
    if (!rateLimit.allowed) {
      recordRequest('DELETE', '/api/user/delete', 429, performance.now() - start, requestId);
      return errorResponse('Too many deletion attempts. Please try again later.', 429, 'RATE_LIMITED');
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      recordRequest('DELETE', '/api/user/delete', 404, performance.now() - start, requestId);
      return errorResponse('User not found', 404, 'USER_NOT_FOUND');
    }

    await prisma.$transaction([
      prisma.quoteSubmission.deleteMany({ where: { submitted_by: session.user.email } }),
      prisma.graffitiSubmission.deleteMany({ where: { artist_name: session.user.email } }),
      prisma.lyricGame.deleteMany({ where: { userId: user.id } }),
      prisma.subscriber.deleteMany({ where: { email: session.user.email } }),
      prisma.user.delete({ where: { id: user.id } }),
    ]);

    recordRequest('DELETE', '/api/user/delete', 200, performance.now() - start, requestId);
    return successResponse({ message: 'Account and associated data deleted successfully' });
  } catch (error) {
    console.error('Data deletion error:', error);
    recordRequest('DELETE', '/api/user/delete', 500, performance.now() - start, requestId);
    return errorResponse('Server error', 500, 'DELETION_ERROR');
  }
}

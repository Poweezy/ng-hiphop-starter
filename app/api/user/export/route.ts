import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/app/db';
import { getRequestId, errorResponse } from '@/lib/api';
import { recordRequest } from '@/lib/observability';

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req);
  const start = performance.now();
  try {
    const session = await auth();
    if (!session?.user?.email) {
      recordRequest('GET', '/api/user/export', 401, performance.now() - start, requestId);
      return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
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

    const [quotes, lyrics, graffiti] = await Promise.all([
      prisma.quoteSubmission.findMany({ where: { submitted_by: session.user.email } }),
      prisma.lyricGame.findMany({ where: { is_active: true } }),
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

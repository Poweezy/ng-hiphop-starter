import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/app/db';
import { getRequestId, errorResponse } from '@/lib/api';

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req);
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
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

    return NextResponse.json(exportData);
  } catch (error) {
    console.error('Data export error:', error);
    return errorResponse('Server error', 500, 'EXPORT_ERROR');
  }
}

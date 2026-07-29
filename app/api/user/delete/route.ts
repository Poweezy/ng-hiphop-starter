import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/app/db';
import { getRequestId, errorResponse, successResponse } from '@/lib/api';

export async function DELETE(req: NextRequest) {
  const requestId = getRequestId(req);
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return errorResponse('User not found', 404, 'USER_NOT_FOUND');
    }

    await prisma.$transaction([
      prisma.quoteSubmission.deleteMany({ where: { submitted_by: session.user.email } }),
      prisma.graffitiSubmission.deleteMany({ where: { artist_name: session.user.email } }),
      prisma.user.delete({ where: { id: user.id } }),
    ]);

    return successResponse({ message: 'Account and associated data deleted successfully' });
  } catch (error) {
    console.error('Data deletion error:', error);
    return errorResponse('Server error', 500, 'DELETION_ERROR');
  }
}

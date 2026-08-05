import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/app/db';
import bcrypt from 'bcryptjs';
import { requireAdmin } from '@/app/api/_lib/admin';
import { errorResponse, successResponse, getRequestId } from '@/lib/api';
import { recordRequest } from '@/lib/observability';

export async function POST(req: NextRequest) {
    const requestId = getRequestId(req);
    const start = performance.now();
    try {
        const { session } = await requireAdmin();
        if (!session) {
            recordRequest('POST', '/api/admin/change-password', 401, performance.now() - start, requestId);
            return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
        }

        const { currentPassword, newPassword } = await req.json();

        if (!currentPassword || !newPassword) {
            recordRequest('POST', '/api/admin/change-password', 400, performance.now() - start, requestId);
            return errorResponse('Current and new password are required', 400, 'MISSING_FIELDS');
        }

        if (newPassword.length < 8) {
            recordRequest('POST', '/api/admin/change-password', 400, performance.now() - start, requestId);
            return errorResponse('New password must be at least 8 characters long', 400, 'PASSWORD_TOO_SHORT');
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user!.email! },
        });

        if (!user) {
            recordRequest('POST', '/api/admin/change-password', 404, performance.now() - start, requestId);
            return errorResponse('User not found', 404, 'USER_NOT_FOUND');
        }

        const isCorrect = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isCorrect) {
            recordRequest('POST', '/api/admin/change-password', 400, performance.now() - start, requestId);
            return errorResponse('Incorrect current password', 400, 'INVALID_PASSWORD');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);

        await prisma.user.update({
            where: { email: session.user!.email! },
            data: { password_hash: hashedPassword, tokenVersion: { increment: 1 } },
        });

        recordRequest('POST', '/api/admin/change-password', 200, performance.now() - start, requestId);
        return successResponse({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        recordRequest('POST', '/api/admin/change-password', 500, performance.now() - start, requestId);
        return errorResponse('Internal server error', 500, 'PASSWORD_CHANGE_ERROR');
    }
}

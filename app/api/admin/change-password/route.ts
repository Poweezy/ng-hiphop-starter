import { NextRequest } from 'next/server';
import { prisma } from '@/app/db';
import bcrypt from 'bcryptjs';
import { requireAdmin } from '@/app/api/_lib/admin';
import { errorResponse, successResponse, getRequestId } from '@/lib/api';
import { recordRequest } from '@/lib/observability';
import { changePasswordSchema } from '@/lib/validations';

export async function POST(req: NextRequest) {
    const requestId = getRequestId(req);
    const start = performance.now();
    try {
        const { session } = await requireAdmin();
        if (!session) {
            recordRequest('POST', '/api/admin/change-password', 401, performance.now() - start, requestId);
            return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
        }

        const body = await req.json();
        const parsed = changePasswordSchema.safeParse(body);

        if (!parsed.success) {
            recordRequest('POST', '/api/admin/change-password', 400, performance.now() - start, requestId);
            return errorResponse('Invalid input', 400, 'VALIDATION_ERROR', parsed.error.issues);
        }

        const { currentPassword, newPassword } = parsed.data;

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

import { NextRequest } from 'next/server';
import { prisma } from '@/app/db';
import { requireAdmin } from '@/app/api/_lib/admin';
import { getRequestId, errorResponse, successResponse } from '@/lib/api';
import { recordRequest } from '@/lib/observability';
import { adminUsersPatchSchema } from '@/lib/validations';

export async function PATCH(req: NextRequest) {
    const requestId = getRequestId(req);
    const start = performance.now();
    try {
        const { session, error } = await requireAdmin();
        if (!session) {
            recordRequest('PATCH', '/api/admin/users', error!.status, performance.now() - start, requestId);
            return errorResponse(error!.message, error!.status, 'UNAUTHORIZED');
        }

        const body = await req.json();
        const parsed = adminUsersPatchSchema.safeParse(body);

        if (!parsed.success) {
            recordRequest('PATCH', '/api/admin/users', 400, performance.now() - start, requestId);
            return errorResponse('Invalid input', 400, 'VALIDATION_ERROR', parsed.error.issues);
        }

        const { id, role } = parsed.data;

        if (id === session.user?.id) {
            recordRequest('PATCH', '/api/admin/users', 400, performance.now() - start, requestId);
            return errorResponse('Cannot change your own role', 400, 'INVALID_OPERATION');
        }

        const updated = await prisma.user.update({
            where: { id },
            data: { role },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        recordRequest('PATCH', '/api/admin/users', 200, performance.now() - start, requestId);
        return successResponse(updated);
    } catch (error) {
        console.error('User update error:', error);
        recordRequest('PATCH', '/api/admin/users', 500, performance.now() - start, requestId);
        return errorResponse('Server error', 500, 'USER_UPDATE_ERROR');
    }
}

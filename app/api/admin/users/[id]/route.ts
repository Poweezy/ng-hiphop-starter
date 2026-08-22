import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { requireAdmin } from '@/app/api/_lib/admin';
import { getRequestId, errorResponse } from '@/lib/api';
import { recordRequest } from '@/lib/observability';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const requestId = getRequestId(req);
    const start = performance.now();
    const { id } = await params;
    try {
        const { session, error } = await requireAdmin();
        if (!session) {
            recordRequest('DELETE', `/api/admin/users/${id}`, error!.status, performance.now() - start, requestId);
            return errorResponse(error!.message, error!.status, 'UNAUTHORIZED');
        }

        const user = await prisma.user.findUnique({
            where: { id },
            select: { id: true, email: true, role: true },
        });

        if (!user) {
            recordRequest('DELETE', `/api/admin/users/${id}`, 404, performance.now() - start, requestId);
            return errorResponse('User not found', 404, 'USER_NOT_FOUND');
        }

        if (id === session.user?.id) {
            recordRequest('DELETE', `/api/admin/users/${id}`, 400, performance.now() - start, requestId);
            return errorResponse('Cannot delete your own account from admin panel', 400, 'INVALID_OPERATION');
        }

        if (user.role === 'ADMIN') {
            recordRequest('DELETE', `/api/admin/users/${id}`, 400, performance.now() - start, requestId);
            return errorResponse('Cannot delete another admin account', 400, 'INVALID_OPERATION');
        }

        await prisma.$transaction([
            prisma.quoteSubmission.deleteMany({ where: { submitted_by: user.email } }),
            prisma.graffitiSubmission.deleteMany({ where: { artist_name: user.email } }),
            prisma.user.delete({ where: { id: user.id } }),
        ]);

        recordRequest('DELETE', `/api/admin/users/${id}`, 200, performance.now() - start, requestId);
        return NextResponse.json(null, { status: 204 });
    } catch (error) {
        console.error('User delete error:', error);
        recordRequest('DELETE', `/api/admin/users/${id}`, 500, performance.now() - start, requestId);
        return errorResponse('Server error', 500, 'USER_DELETE_ERROR');
    }
}

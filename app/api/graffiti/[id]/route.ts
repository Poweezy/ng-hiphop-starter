import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { storage } from '@/lib/storage';
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
            recordRequest('DELETE', `/api/graffiti/${id}`, error!.status, performance.now() - start, requestId);
            return errorResponse(error!.message, error!.status, 'UNAUTHORIZED');
        }

        const graffiti = await prisma.graffitiSubmission.findUnique({ where: { id } });
        if (!graffiti) {
            recordRequest('DELETE', `/api/graffiti/${id}`, 404, performance.now() - start, requestId);
            return errorResponse('Graffiti not found', 404, 'NOT_FOUND');
        }

        await prisma.$transaction(async (tx) => {
            if (graffiti.image_key) {
                await storage.deleteByKey(graffiti.image_key);
            } else if (graffiti.image_url) {
                await storage.deleteFile(graffiti.image_url);
            }
            await tx.graffitiSubmission.delete({ where: { id } });
        });

        recordRequest('DELETE', `/api/graffiti/${id}`, 204, performance.now() - start, requestId);
        return NextResponse.json(null, { status: 204 });
    } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2025') {
            recordRequest('DELETE', `/api/graffiti/${id}`, 404, performance.now() - start, requestId);
            return errorResponse('Graffiti not found', 404, 'NOT_FOUND');
        }
        console.error('Graffiti delete error:', error);
        recordRequest('DELETE', `/api/graffiti/${id}`, 500, performance.now() - start, requestId);
        return errorResponse('Server error', 500, 'GRAFFITI_DELETE_ERROR');
    }
}

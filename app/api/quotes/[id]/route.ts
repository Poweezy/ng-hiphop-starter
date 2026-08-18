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
            recordRequest('DELETE', `/api/quotes/${id}`, error!.status, performance.now() - start, requestId);
            return errorResponse(error!.message, error!.status, 'UNAUTHORIZED');
        }

        try {
            await prisma.quoteSubmission.delete({ where: { id } });
        } catch (error) {
            if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2025') {
                recordRequest('DELETE', `/api/quotes/${id}`, 404, performance.now() - start, requestId);
                return errorResponse('Quote not found', 404, 'NOT_FOUND');
            }
            throw error;
        }

        recordRequest('DELETE', `/api/quotes/${id}`, 204, performance.now() - start, requestId);
        return NextResponse.json(null, { status: 204 });
    } catch (error) {
        console.error('Quote delete error:', error);
        recordRequest('DELETE', `/api/quotes/${id}`, 500, performance.now() - start, requestId);
        return errorResponse('Server error', 500, 'QUOTE_DELETE_ERROR');
    }
}

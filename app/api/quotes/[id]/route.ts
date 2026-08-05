import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { requireAdmin } from '@/app/api/_lib/admin';
import { getRequestId, errorResponse } from '@/lib/api';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const requestId = getRequestId(req);
    try {
        const { id } = await params;
        const { session } = await requireAdmin();
        if (!session) return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');

        await prisma.quoteSubmission.delete({ where: { id } });
        return NextResponse.json(null, { status: 204 });
    } catch (error) {
        console.error('Quote delete error:', error);
        return errorResponse('Server error', 500, 'QUOTE_DELETE_ERROR');
    }
}

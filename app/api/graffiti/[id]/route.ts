import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { storage } from '@/lib/storage';
import { requireAdmin } from '@/app/api/_lib/admin';
import { getRequestId, errorResponse } from '@/lib/api';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const requestId = getRequestId(req);
    try {
        const { session } = await requireAdmin();
        if (!session) return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');

        const graffiti = await prisma.graffitiSubmission.findUnique({ where: { id: params.id } });
        if (graffiti) {
            if (graffiti.image_key) {
                await storage.deleteByKey(graffiti.image_key);
            } else if (graffiti.image_url) {
                await storage.deleteFile(graffiti.image_url);
            }
        }

        await prisma.graffitiSubmission.delete({ where: { id: params.id } });
        return NextResponse.json(null, { status: 204 });
    } catch (error) {
        console.error('Graffiti delete error:', error);
        return errorResponse('Server error', 500, 'GRAFFITI_DELETE_ERROR');
    }
}

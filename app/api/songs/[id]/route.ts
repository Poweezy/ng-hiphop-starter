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
            recordRequest('DELETE', `/api/songs/${id}`, error!.status, performance.now() - start, requestId);
            return errorResponse(error!.message, error!.status, 'UNAUTHORIZED');
        }

        const song = await prisma.song.findUnique({ where: { id } });
        if (!song) {
            recordRequest('DELETE', `/api/songs/${id}`, 404, performance.now() - start, requestId);
            return errorResponse('Song not found', 404, 'NOT_FOUND');
        }

        await prisma.$transaction(async (tx) => {
            if (song.file_key) {
                await storage.deleteByKey(song.file_key);
            } else if (song.file_url) {
                await storage.deleteFile(song.file_url);
            }
            if (song.cover_key) {
                await storage.deleteByKey(song.cover_key);
            } else if (song.cover_url) {
                await storage.deleteFile(song.cover_url);
            }
            await tx.song.delete({ where: { id } });
        });

        recordRequest('DELETE', `/api/songs/${id}`, 204, performance.now() - start, requestId);
        return NextResponse.json(null, { status: 204 });
    } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2025') {
            recordRequest('DELETE', `/api/songs/${id}`, 404, performance.now() - start, requestId);
            return errorResponse('Song not found', 404, 'NOT_FOUND');
        }
        console.error('Song delete error:', error);
        recordRequest('DELETE', `/api/songs/${id}`, 500, performance.now() - start, requestId);
        return errorResponse('Server error', 500, 'SONG_DELETE_ERROR');
    }
}

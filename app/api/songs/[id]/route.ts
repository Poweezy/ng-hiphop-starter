import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { storage } from '@/lib/storage';
import { requireAdmin } from '@/app/api/_lib/admin';
import { getRequestId, errorResponse } from '@/lib/api';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const requestId = getRequestId(req);
    try {
        const { id } = await params;
        const { session } = await requireAdmin();
        if (!session) return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');

        const song = await prisma.song.findUnique({ where: { id } });
        if (song) {
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
        }

        await prisma.song.delete({ where: { id } });
        return NextResponse.json(null, { status: 204 });
    } catch (error) {
        console.error('Song delete error:', error);
        return errorResponse('Server error', 500, 'SONG_DELETE_ERROR');
    }
}

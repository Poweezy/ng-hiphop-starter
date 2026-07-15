import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { lyricCreateSchema, lyricUpdateSchema, lyricDeleteSchema } from '@/lib/validations';
import { requireAdmin } from '@/app/api/_lib/admin';
import { getRequestId, errorResponse, successResponse } from '@/lib/api';
import { extractIdempotencyKey, getCachedIdempotentResponse, withIdempotency } from '@/lib/idempotency';

export async function GET(req: NextRequest) {
    const requestId = getRequestId(req);
    try {
        const lyrics = await prisma.lyricGame.findMany({
            where: { is_active: true },
            orderBy: { createdAt: 'asc' },
            take: 200,
        });
        return successResponse(lyrics);
    } catch (error) {
        console.error('Lyric fetch error:', error);
        return errorResponse('Server error', 500, 'LYRIC_FETCH_ERROR');
    }
}

export async function POST(req: NextRequest) {
    const requestId = getRequestId(req);
    try {
        const { session } = await requireAdmin();
        if (!session) return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');

        const idempotencyKey = extractIdempotencyKey(req);
        if (idempotencyKey) {
            const cached = getCachedIdempotentResponse(idempotencyKey);
            if (cached) {
                return NextResponse.json(cached.response, { status: cached.status });
            }
        }

        const body = await req.json();
        const validation = lyricCreateSchema.safeParse(body);
        
        if (!validation.success) {
            return errorResponse('Invalid input', 400, 'VALIDATION_ERROR', validation.error.issues);
        }

        const { lyric_text, correct_artist, is_active } = validation.data;

        const create = async () => {
            const entry = await prisma.lyricGame.create({
                data: { lyric_text, correct_artist, is_active: !!is_active },
            });
            return { response: entry, status: 201 as const };
        };

        const { response, status } = idempotencyKey
            ? await withIdempotency(idempotencyKey, create)
            : await create();

        return successResponse(response, status);
    } catch (error) {
        console.error('Lyric creation error:', error);
        return errorResponse('Server error', 500, 'LYRIC_CREATION_ERROR');
    }
}

export async function PATCH(req: NextRequest) {
    const requestId = getRequestId(req);
    try {
        const { session } = await requireAdmin();
        if (!session) return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');

        const body = await req.json();
        const validation = lyricUpdateSchema.safeParse(body);
        
        if (!validation.success) {
            return errorResponse('Invalid input', 400, 'VALIDATION_ERROR', validation.error.issues);
        }

        const { id, is_active, lyric_text, correct_artist } = validation.data;

        const updated = await prisma.lyricGame.update({
            where: { id },
            data: {
                ...(is_active !== undefined ? { is_active } : {}),
                ...(lyric_text ? { lyric_text } : {}),
                ...(correct_artist ? { correct_artist } : {}),
            },
        });
        return successResponse(updated);
    } catch (error) {
        console.error('Lyric update error:', error);
        return errorResponse('Server error', 500, 'LYRIC_UPDATE_ERROR');
    }
}

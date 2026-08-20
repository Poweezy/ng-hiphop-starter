import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { lyricCreateSchema, lyricUpdateSchema, lyricDeleteSchema } from '@/lib/validations';
import { errorResponse, successResponse, getRequestId } from '@/lib/api';
import { recordRequest } from '@/lib/observability';
import { extractIdempotencyKey, getCachedIdempotentResponse, withIdempotency } from '@/lib/idempotency';
import { checkRateLimit } from '@/lib/ratelimit';
import { getClientIp } from '@/lib/ip';
import { auth } from '@/lib/auth';
import { requireAdmin } from '@/app/api/_lib/admin';
import { notifyAdminModeration } from '@/lib/moderation';

export async function GET(req: NextRequest) {
    const requestId = getRequestId(req);
    const start = performance.now();
    try {
        const lyrics = await prisma.lyricGame.findMany({
            where: { is_active: true },
            orderBy: { createdAt: 'asc' },
            take: 200,
        });
        recordRequest('GET', '/api/lyrics', 200, performance.now() - start, requestId);
        return successResponse(lyrics);
    } catch (error) {
        console.error('Lyric fetch error:', error);
        recordRequest('GET', '/api/lyrics', 500, performance.now() - start, requestId);
        return errorResponse('Server error', 500, 'LYRIC_FETCH_ERROR');
    }
}

export async function POST(req: NextRequest) {
    const requestId = getRequestId(req);
    const start = performance.now();
    try {
        const ip = getClientIp(req);
        const { allowed } = await checkRateLimit({ key: `lyrics:${ip}`, max: 3, periodSeconds: 60 });
        if (!allowed) {
            recordRequest('POST', '/api/lyrics', 429, performance.now() - start, requestId);
            return errorResponse('Too many lyric submissions. Please wait a minute and try again.', 429, 'RATE_LIMIT_EXCEEDED');
        }

        const idempotencyKey = extractIdempotencyKey(req);
        if (idempotencyKey) {
            const cached = getCachedIdempotentResponse(idempotencyKey);
            if (cached) {
                recordRequest('POST', '/api/lyrics', cached.status, performance.now() - start, requestId);
                return NextResponse.json(cached.response, { status: cached.status });
            }
        }

        const session = await auth();
        const userId = session?.user?.id ?? null;

        const body = await req.json();
        const validation = lyricCreateSchema.safeParse(body);
        
        if (!validation.success) {
            recordRequest('POST', '/api/lyrics', 400, performance.now() - start, requestId);
            return errorResponse('Invalid input', 400, 'VALIDATION_ERROR', validation.error.issues);
        }

        const { lyric_text, correct_artist, is_active } = validation.data;

        const create = async () => {
            const entry = await prisma.lyricGame.create({
                data: { lyric_text, correct_artist, is_active: !!is_active, userId },
            });
            return { response: entry, status: 201 as const };
        };

        const { response, status } = idempotencyKey
            ? await withIdempotency(idempotencyKey, create)
            : await create();

        if (typeof response === 'object' && response !== null && 'id' in response) {
            notifyAdminModeration({
                submissionType: 'lyric',
                submissionId: (response as { id: string }).id,
                submittedBy: userId ?? '',
            }).catch((err) => {
                console.error('Moderation notification failed:', err);
            });
        }

        recordRequest('POST', '/api/lyrics', status, performance.now() - start, requestId);
        return successResponse(response, status);
    } catch (error) {
        console.error('Lyric creation error:', error);
        recordRequest('POST', '/api/lyrics', 500, performance.now() - start, requestId);
        return errorResponse('Server error', 500, 'LYRIC_CREATION_ERROR');
    }
}

export async function PATCH(req: NextRequest) {
    const requestId = getRequestId(req);
    const start = performance.now();
    try {
        const { session } = await requireAdmin();
        if (!session) {
            recordRequest('PATCH', '/api/lyrics', 401, performance.now() - start, requestId);
            return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
        }

        const body = await req.json();
        const validation = lyricUpdateSchema.safeParse(body);
        
        if (!validation.success) {
            recordRequest('PATCH', '/api/lyrics', 400, performance.now() - start, requestId);
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
        recordRequest('PATCH', '/api/lyrics', 200, performance.now() - start, requestId);
        return successResponse(updated);
    } catch (error) {
        console.error('Lyric update error:', error);
        recordRequest('PATCH', '/api/lyrics', 500, performance.now() - start, requestId);
        return errorResponse('Server error', 500, 'LYRIC_UPDATE_ERROR');
    }
}

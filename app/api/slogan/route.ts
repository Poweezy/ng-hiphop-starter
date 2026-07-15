import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { sloganUpdateSchema } from '@/lib/validations';
import { requireAdmin } from '@/app/api/_lib/admin';
import { getRequestId, errorResponse, successResponse } from '@/lib/api';
import { extractIdempotencyKey, getCachedIdempotentResponse, withIdempotency } from '@/lib/idempotency';

export async function GET(req: NextRequest) {
    const requestId = getRequestId(req);
    try {
        const slogan = await prisma.slogan.findUnique({ where: { id: 1 } });
        return successResponse({ text: slogan?.text ?? 'Built From Bars. Raised By Beats.' });
    } catch (error) {
        console.error('Slogan fetch error:', error);
        return errorResponse('Server error', 500, 'SLOGAN_FETCH_ERROR');
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
        const validation = sloganUpdateSchema.safeParse(body);
        
        if (!validation.success) {
            return errorResponse('Invalid input', 400, 'VALIDATION_ERROR', validation.error.issues);
        }
        
        const { slogan } = validation.data;
        
        const update = async () => {
            const updated = await prisma.slogan.upsert({
                where: { id: 1 },
                update: { text: slogan },
                create: { id: 1, text: slogan },
            });
            const response = { message: 'Slogan updated', text: updated.text };
            return { response, status: 200 as const };
        };

        const { response, status } = idempotencyKey
            ? await withIdempotency(idempotencyKey, update)
            : await update();

        return successResponse(response, status);
    } catch (error) {
        console.error('Slogan update error:', error);
        return errorResponse('Server error', 500, 'SLOGAN_UPDATE_ERROR');
    }
}

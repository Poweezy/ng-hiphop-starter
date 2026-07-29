import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { auth } from '@/lib/auth';
import { quoteSubmissionSchema, quoteUpdateSchema } from '@/lib/validations';
import { z } from 'zod';

import { getClientIp } from '@/lib/ip';
import { checkRateLimit } from '@/lib/ratelimit';
import { requireAdmin } from '@/app/api/_lib/admin';
import { recordRequest } from '@/lib/observability';
import { notifyAdminModeration } from '@/lib/moderation';
import { getRequestId, errorResponse, successResponse } from '@/lib/api';
import { extractIdempotencyKey, getCachedIdempotentResponse, withIdempotency } from '@/lib/idempotency';


export async function GET(req: NextRequest) {
    const requestId = getRequestId(req);
    const start = performance.now();
    try {
        const session = await auth();
        const userRole = session?.user?.role ?? null;
        const isAdmin = userRole === 'ADMIN';

        if (isAdmin) {
            const { searchParams } = new URL(req.url);
            const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
            const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));
            const skip = (page - 1) * limit;

            const [quotes, total] = await Promise.all([
                prisma.quoteSubmission.findMany({ 
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit,
                }),
                prisma.quoteSubmission.count(),
            ]);
            
            recordRequest('GET', '/api/quotes', 200, performance.now() - start, requestId);
            return successResponse({ 
                quotes, 
                pagination: { page, limit, total, pages: Math.ceil(total / limit) } 
            });
        }
        
        const featured = await prisma.quoteSubmission.findFirst({
            where: {
                approved: true,
                is_featured: true,
                OR: [{ display_until: null }, { display_until: { gte: new Date() } }],
            },
        });
        recordRequest('GET', '/api/quotes', 200, performance.now() - start, requestId);
        return successResponse(featured);
    } catch (error) {
        console.error('Quote fetch error:', error);
        recordRequest('GET', '/api/quotes', 500, performance.now() - start, requestId);
        return errorResponse('Server error', 500, 'QUOTE_FETCH_ERROR');
    }
}

export async function POST(req: NextRequest) {
    const requestId = getRequestId(req);
    const start = performance.now();
    try {
        const ip = getClientIp(req);
        const key = `quotes:${ip}`;
        const { allowed } = await checkRateLimit({ key, max: 3, periodSeconds: 60 });
        if (!allowed) {
            recordRequest('POST', '/api/quotes', 429, performance.now() - start, requestId);
            return errorResponse('Too many submissions. Please wait.', 429, 'RATE_LIMIT_EXCEEDED');
        }

        const idempotencyKey = extractIdempotencyKey(req);
        if (idempotencyKey) {
            const cached = getCachedIdempotentResponse(idempotencyKey);
            if (cached) {
                return NextResponse.json(cached.response, { status: cached.status });
            }
        }

        const body = await req.json();

        const normalized = {
            name: (body?.name ?? body?.submitted_by ?? body?.alias ?? '').toString(),
            quote: (body?.quote ?? body?.quote_text ?? body?.message ?? '').toString(),
        };

        const validation = quoteSubmissionSchema.safeParse(normalized);
        if (!validation.success) {
            console.error('Quote validation failed:', validation.error.issues, normalized);
            recordRequest('POST', '/api/quotes', 400, performance.now() - start, requestId);
            return errorResponse('Invalid input', 400, 'VALIDATION_ERROR', validation.error.issues);
        }

        const { name, quote } = validation.data;

        const create = async () => {
            const newQuote = await prisma.quoteSubmission.create({
                data: { quote_text: quote, submitted_by: name },
            });
            const response = { message: 'Quote submitted for approval' };
            return { response, status: 201 as const };
        };

        const { response, status } = idempotencyKey
            ? await withIdempotency(idempotencyKey, create)
            : await create();

        if (typeof response === 'object' && response !== null && 'id' in response) {
            notifyAdminModeration({ submissionType: 'quote', submissionId: (response as { id: string }).id, submittedBy: name }).catch(() => {});
        }

        recordRequest('POST', '/api/quotes', status, performance.now() - start, requestId);
        return successResponse(response, status);
    } catch (error) {
        console.error('Quote submission error:', error);
        recordRequest('POST', '/api/quotes', 500, performance.now() - start, requestId);
        return errorResponse('Server error', 500, 'QUOTE_SUBMISSION_ERROR');
    }
}


export async function PATCH(req: NextRequest) {
    const requestId = getRequestId(req);
    const start = performance.now();
    try {
        const { session, error } = await requireAdmin();
        if (!session) {
            recordRequest('PATCH', '/api/quotes', error!.status, performance.now() - start, requestId);
            return errorResponse(error!.message, error!.status, 'UNAUTHORIZED');
        }

        const body = await req.json();
        const validation = quoteUpdateSchema.safeParse(body);
        
        if (!validation.success) {
            recordRequest('PATCH', '/api/quotes', 400, performance.now() - start, requestId);
            return errorResponse('Invalid input', 400, 'VALIDATION_ERROR', validation.error.issues);
        }

        const { id, approved, is_featured, display_until } = validation.data;

        if (is_featured) {
            await prisma.$transaction([
                prisma.quoteSubmission.updateMany({ data: { is_featured: false } }),
                prisma.quoteSubmission.update({
                    where: { id },
                    data: { is_featured: true },
                }),
            ]);
        }

        const updated = await prisma.quoteSubmission.update({
            where: { id },
            data: {
                ...(approved !== undefined ? { approved } : {}),
                ...(display_until !== undefined ? { display_until: display_until ? new Date(display_until) : null } : {}),
            },
        });

        recordRequest('PATCH', '/api/quotes', 200, performance.now() - start, requestId);
        return successResponse(updated);
    } catch (error) {
        console.error('Quote update error:', error);
        recordRequest('PATCH', '/api/quotes', 500, performance.now() - start, requestId);
        return errorResponse('Server error', 500, 'QUOTE_UPDATE_ERROR');
    }
}

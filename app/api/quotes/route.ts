import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { quoteSubmissionSchema, quoteUpdateSchema } from '@/lib/validations';
import { z } from 'zod';

import { getClientIp } from '@/lib/ip';
import { checkRateLimit } from '@/lib/ratelimit';
import { requireAdmin } from '@/app/api/_lib/admin';
import { recordRequest } from '@/lib/observability';
import { notifyAdminModeration } from '@/lib/moderation';


export async function GET(req: NextRequest) {
    const start = performance.now();
    try {
        const session = await getServerSession(authOptions);
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
            
            recordRequest('GET', '/api/quotes', 200, performance.now() - start);
            return NextResponse.json({ 
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
        recordRequest('GET', '/api/quotes', 200, performance.now() - start);
        return NextResponse.json(featured);
    } catch (error) {
        console.error('Quote fetch error:', error);
        recordRequest('GET', '/api/quotes', 500, performance.now() - start);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const start = performance.now();
    try {
        const ip = getClientIp(req);
        const key = `quotes:${ip}`;
        const { allowed } = await checkRateLimit({ key, max: 3, periodSeconds: 60 });
        if (!allowed) {
            recordRequest('POST', '/api/quotes', 429, performance.now() - start);
            return NextResponse.json({ message: 'Too many submissions. Please wait.' }, { status: 429 });
        }

        const body = await req.json();

        const normalized = {
            name: (body?.name ?? body?.submitted_by ?? body?.alias ?? '').toString(),
            quote: (body?.quote ?? body?.quote_text ?? body?.message ?? '').toString(),
        };

        const validation = quoteSubmissionSchema.safeParse(normalized);
        if (!validation.success) {
            console.error('Quote validation failed:', validation.error.issues, normalized);
            recordRequest('POST', '/api/quotes', 400, performance.now() - start);
            return NextResponse.json(
                { message: 'Invalid input' },
                { status: 400 }
            );
        }

        const { name, quote } = validation.data;

        const newQuote = await prisma.quoteSubmission.create({
            data: { quote_text: quote, submitted_by: name },
        });

        notifyAdminModeration({ submissionType: 'quote', submissionId: newQuote.id, submittedBy: name }).catch(() => {});

        recordRequest('POST', '/api/quotes', 201, performance.now() - start);
        return NextResponse.json({ message: 'Quote submitted for approval' }, { status: 201 });
    } catch (error) {
        console.error('Quote submission error:', error);
        recordRequest('POST', '/api/quotes', 500, performance.now() - start);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}


export async function PATCH(req: NextRequest) {
    const start = performance.now();
    try {
        const { session, error } = await requireAdmin();
        if (!session) {
            recordRequest('PATCH', '/api/quotes', error!.status, performance.now() - start);
            return NextResponse.json({ message: error!.message }, { status: error!.status });
        }

        const body = await req.json();
        const validation = quoteUpdateSchema.safeParse(body);
        
        if (!validation.success) {
            recordRequest('PATCH', '/api/quotes', 400, performance.now() - start);
            return NextResponse.json({ 
                message: 'Invalid input', 
                errors: validation.error.issues 
            }, { status: 400 });
        }

        const { id, approved, is_featured, display_until } = validation.data;

        if (is_featured) {
            // Atomically clear other featured quotes, then set this one.
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

        recordRequest('PATCH', '/api/quotes', 200, performance.now() - start);
        return NextResponse.json(updated);
    } catch (error) {
        console.error('Quote update error:', error);
        recordRequest('PATCH', '/api/quotes', 500, performance.now() - start);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const start = performance.now();
    try {
        const { session, error } = await requireAdmin();
        if (!session) {
            recordRequest('DELETE', '/api/quotes', error!.status, performance.now() - start);
            return NextResponse.json({ message: error!.message }, { status: error!.status });
        }

        const body = await req.json();
        const { id } = z.object({ id: z.string().cuid() }).parse(body);

        await prisma.quoteSubmission.delete({ where: { id } });
        recordRequest('DELETE', '/api/quotes', 200, performance.now() - start);
        return NextResponse.json({ message: 'Quote deleted' });
    } catch (error) {
        console.error('Quote delete error:', error);
        recordRequest('DELETE', '/api/quotes', 500, performance.now() - start);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

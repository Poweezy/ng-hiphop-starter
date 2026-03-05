import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { quoteSubmissionSchema, quoteUpdateSchema } from '@/lib/validations';
import { z } from 'zod';

// Simple in-memory rate limiter per IP
const submissionLog = new Map<string, number[]>();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_PER_WINDOW = 3;

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const log = submissionLog.get(ip) ?? [];
    const recent = log.filter((t) => now - t < WINDOW_MS);
    submissionLog.set(ip, [...recent, now]);
    return recent.length >= MAX_PER_WINDOW;
}

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = session?.user && 'role' in session.user ? (session.user as any).role : null;
        const isAdmin = userRole === 'ADMIN';

        if (isAdmin) {
            const { searchParams } = new URL(req.url);
            const page = parseInt(searchParams.get('page') || '1');
            const limit = parseInt(searchParams.get('limit') || '20');
            const skip = (page - 1) * limit;

            const [quotes, total] = await Promise.all([
                prisma.quoteSubmission.findMany({ 
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit,
                }),
                prisma.quoteSubmission.count(),
            ]);
            
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
        return NextResponse.json(featured);
    } catch (error) {
        console.error('Quote fetch error:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
        if (isRateLimited(ip)) {
            return NextResponse.json({ message: 'Too many submissions. Please wait.' }, { status: 429 });
        }

        const body = await req.json();
        const validation = quoteSubmissionSchema.safeParse(body);
        
        if (!validation.success) {
            return NextResponse.json({ 
                message: 'Invalid input', 
                errors: validation.error.errors 
            }, { status: 400 });
        }

        const { name, quote } = validation.data;

        await prisma.quoteSubmission.create({
            data: { quote_text: quote, submitted_by: name },
        });

        return NextResponse.json({ message: 'Quote submitted for approval' }, { status: 201 });
    } catch (error) {
        console.error('Quote submission error:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = session?.user && 'role' in session.user ? (session.user as any).role : null;
        
        if (!session || userRole !== 'ADMIN') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const validation = quoteUpdateSchema.safeParse(body);
        
        if (!validation.success) {
            return NextResponse.json({ 
                message: 'Invalid input', 
                errors: validation.error.errors 
            }, { status: 400 });
        }

        const { id, approved, is_featured, display_until } = validation.data;

        // If featuring, unfeatured others first
        if (is_featured) {
            await prisma.quoteSubmission.updateMany({ data: { is_featured: false } });
        }

        const updated = await prisma.quoteSubmission.update({
            where: { id },
            data: {
                ...(approved !== undefined ? { approved } : {}),
                ...(is_featured !== undefined ? { is_featured } : {}),
                ...(display_until !== undefined ? { display_until: display_until ? new Date(display_until) : null } : {}),
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Quote update error:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = session?.user && 'role' in session.user ? (session.user as any).role : null;
        
        if (!session || userRole !== 'ADMIN') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { id } = z.object({ id: z.string().cuid() }).parse(body);

        await prisma.quoteSubmission.delete({ where: { id } });
        return NextResponse.json({ message: 'Quote deleted' });
    } catch (error) {
        console.error('Quote delete error:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

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
        const isAdmin = (session?.user as any)?.role === 'ADMIN';

        if (isAdmin) {
            const quotes = await prisma.quoteSubmission.findMany({ orderBy: { createdAt: 'desc' } });
            return NextResponse.json(quotes);
        }

        // Public: only featured approved quote
        const featured = await prisma.quoteSubmission.findFirst({
            where: {
                approved: true,
                is_featured: true,
                OR: [{ display_until: null }, { display_until: { gte: new Date() } }],
            },
        });
        return NextResponse.json(featured);
    } catch {
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
        const { name, quote } = body;

        const sanitize = (s: string) =>
            String(s).replace(/[<>]/g, '').trim().slice(0, 280);

        const cleanName = sanitize(name ?? '');
        const cleanQuote = sanitize(quote ?? '');

        if (!cleanName || cleanName.length < 2 || !cleanQuote || cleanQuote.length < 5) {
            return NextResponse.json({ message: 'Name and quote are required' }, { status: 400 });
        }

        await prisma.quoteSubmission.create({
            data: { quote_text: cleanQuote, submitted_by: cleanName },
        });

        return NextResponse.json({ message: 'Quote submitted for approval' }, { status: 201 });
    } catch {
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any)?.role !== 'ADMIN') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { id, approved, is_featured, display_until } = body;

        if (!id) return NextResponse.json({ message: 'ID required' }, { status: 400 });

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
    } catch {
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

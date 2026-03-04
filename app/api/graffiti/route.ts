import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const uploadLog = new Map<string, number[]>();
function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const log = uploadLog.get(ip) ?? [];
    const recent = log.filter((t) => now - t < 60000);
    uploadLog.set(ip, [...recent, now]);
    return recent.length >= 2;
}

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const isAdmin = (session?.user as any)?.role === 'ADMIN';

        if (isAdmin) {
            const all = await prisma.graffitiSubmission.findMany({ orderBy: { createdAt: 'desc' } });
            return NextResponse.json(all);
        }

        const approved = await prisma.graffitiSubmission.findMany({
            where: { approved: true, OR: [{ display_until: null }, { display_until: { gte: new Date() } }] },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });
        return NextResponse.json(approved);
    } catch {
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
        if (isRateLimited(ip)) {
            return NextResponse.json({ message: 'Too many uploads. Please wait.' }, { status: 429 });
        }

        const formData = await req.formData();
        const file = formData.get('image') as File | null;
        const artistName = (formData.get('artistName') as string ?? '').trim().slice(0, 60);

        if (!file || !artistName) {
            return NextResponse.json({ message: 'Image and artist name required' }, { status: 400 });
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json({ message: 'Only JPG, PNG, WEBP allowed' }, { status: 400 });
        }
        if (file.size > MAX_SIZE_BYTES) {
            return NextResponse.json({ message: 'Image must be under 5MB' }, { status: 400 });
        }

        const ext = file.type.split('/')[1];
        const filename = `${uuidv4()}.${ext}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'graffiti');
        await mkdir(uploadDir, { recursive: true });

        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(path.join(uploadDir, filename), buffer);

        await prisma.graffitiSubmission.create({
            data: {
                image_url: `/uploads/graffiti/${filename}`,
                artist_name: artistName,
            },
        });

        return NextResponse.json({ message: 'Artwork submitted for approval' }, { status: 201 });
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

        const { id, approved, display_until } = await req.json();
        if (!id) return NextResponse.json({ message: 'ID required' }, { status: 400 });

        const updated = await prisma.graffitiSubmission.update({
            where: { id },
            data: {
                ...(approved !== undefined ? { approved } : {}),
                ...(display_until !== undefined ? { display_until: display_until ? new Date(display_until) : null } : {}),
            },
        });

        return NextResponse.json(updated);
    } catch {
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

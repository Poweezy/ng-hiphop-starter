import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
    try {
        const lyrics = await prisma.lyricGame.findMany({
            where: { is_active: true },
            orderBy: { createdAt: 'asc' },
        });
        return NextResponse.json(lyrics);
    } catch {
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any)?.role !== 'ADMIN') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { lyric_text, correct_artist, is_active } = await req.json();
        const clean = (s: string) => String(s ?? '').replace(/[<>]/g, '').trim();

        const lText = clean(lyric_text).slice(0, 300);
        const lArtist = clean(correct_artist).slice(0, 80);

        if (!lText || !lArtist) {
            return NextResponse.json({ message: 'Lyric and artist required' }, { status: 400 });
        }

        const entry = await prisma.lyricGame.create({
            data: { lyric_text: lText, correct_artist: lArtist, is_active: !!is_active },
        });
        return NextResponse.json(entry, { status: 201 });
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

        const { id, is_active, lyric_text, correct_artist } = await req.json();
        if (!id) return NextResponse.json({ message: 'ID required' }, { status: 400 });

        const clean = (s: string) => String(s ?? '').replace(/[<>]/g, '').trim();

        const updated = await prisma.lyricGame.update({
            where: { id },
            data: {
                ...(is_active !== undefined ? { is_active } : {}),
                ...(lyric_text ? { lyric_text: clean(lyric_text).slice(0, 300) } : {}),
                ...(correct_artist ? { correct_artist: clean(correct_artist).slice(0, 80) } : {}),
            },
        });
        return NextResponse.json(updated);
    } catch {
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any)?.role !== 'ADMIN') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        const { id } = await req.json();
        if (!id) return NextResponse.json({ message: 'ID required' }, { status: 400 });
        await prisma.lyricGame.delete({ where: { id } });
        return NextResponse.json({ message: 'Deleted' });
    } catch {
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

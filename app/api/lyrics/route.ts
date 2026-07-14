import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { lyricCreateSchema, lyricUpdateSchema, lyricDeleteSchema } from '@/lib/validations';
import { requireAdmin } from '@/app/api/_lib/admin';

export async function GET() {
    try {
        const lyrics = await prisma.lyricGame.findMany({
            where: { is_active: true },
            orderBy: { createdAt: 'asc' },
            take: 200,
        });
        return NextResponse.json(lyrics);
    } catch {
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { session } = await requireAdmin();
        if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const validation = lyricCreateSchema.safeParse(body);
        
        if (!validation.success) {
            return NextResponse.json({ 
                message: 'Invalid input', 
                errors: validation.error.issues 
            }, { status: 400 });
        }

        const { lyric_text, correct_artist, is_active } = validation.data;

        const entry = await prisma.lyricGame.create({
            data: { lyric_text, correct_artist, is_active: !!is_active },
        });
        return NextResponse.json(entry, { status: 201 });
    } catch (error) {
        console.error('Lyric creation error:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const { session } = await requireAdmin();
        if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const validation = lyricUpdateSchema.safeParse(body);
        
        if (!validation.success) {
            return NextResponse.json({ 
                message: 'Invalid input', 
                errors: validation.error.issues 
            }, { status: 400 });
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
        return NextResponse.json(updated);
    } catch (error) {
        console.error('Lyric update error:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { session } = await requireAdmin();
        if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        
        const body = await req.json();
        const validation = lyricDeleteSchema.safeParse(body);
        
        if (!validation.success) {
            return NextResponse.json({ 
                message: 'Invalid input', 
                errors: validation.error.issues 
            }, { status: 400 });
        }
        
        const { id } = validation.data;
        await prisma.lyricGame.delete({ where: { id } });
        return NextResponse.json({ message: 'Deleted' });
    } catch (error) {
        console.error('Lyric delete error:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

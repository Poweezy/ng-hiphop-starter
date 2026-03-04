import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_AUDIO = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mp4'];
const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_AUDIO_BYTES = 50 * 1024 * 1024; // 50MB
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;  // 5MB

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const isAdmin = (session?.user as any)?.role === 'ADMIN';

        if (isAdmin) {
            const songs = await prisma.song.findMany({ orderBy: { createdAt: 'desc' } });
            return NextResponse.json(songs);
        }
        const song = await prisma.song.findFirst({ where: { is_active: true }, orderBy: { updatedAt: 'desc' } });
        return NextResponse.json(song);
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

        const formData = await req.formData();
        const audioFile = formData.get('audio') as File | null;
        const coverFile = formData.get('cover') as File | null;
        const title = (formData.get('title') as string ?? '').trim().slice(0, 120);
        const description = (formData.get('description') as string ?? '').trim().slice(0, 500);
        const distributionLinks = formData.get('distributionLinks') as string | null;
        const publisherLink = formData.get('publisherLink') as string | null;

        if (!audioFile || !coverFile || !title) {
            return NextResponse.json({ message: 'Audio file, cover image, and title are required' }, { status: 400 });
        }

        // Validate audio
        if (!ALLOWED_AUDIO.includes(audioFile.type) && !audioFile.name.match(/\.(mp3|wav|ogg|m4a)$/i)) {
            return NextResponse.json({ message: 'Invalid audio format' }, { status: 400 });
        }
        if (audioFile.size > MAX_AUDIO_BYTES) {
            return NextResponse.json({ message: 'Audio must be under 50MB' }, { status: 400 });
        }

        // Validate cover
        if (!ALLOWED_IMAGE.includes(coverFile.type)) {
            return NextResponse.json({ message: 'Cover must be JPG, PNG, or WEBP' }, { status: 400 });
        }
        if (coverFile.size > MAX_IMAGE_BYTES) {
            return NextResponse.json({ message: 'Cover image must be under 5MB' }, { status: 400 });
        }

        // Save files
        const audioExt = audioFile.name.split('.').pop() ?? 'mp3';
        const audioName = `${uuidv4()}.${audioExt}`;
        const coverExt = coverFile.type.split('/')[1];
        const coverName = `${uuidv4()}.${coverExt}`;

        const audioDir = path.join(process.cwd(), 'public', 'uploads', 'songs');
        const coverDir = path.join(process.cwd(), 'public', 'uploads', 'covers');
        await mkdir(audioDir, { recursive: true });
        await mkdir(coverDir, { recursive: true });

        await writeFile(path.join(audioDir, audioName), Buffer.from(await audioFile.arrayBuffer()));
        await writeFile(path.join(coverDir, coverName), Buffer.from(await coverFile.arrayBuffer()));

        // Deactivate others if setting active
        await prisma.song.updateMany({ data: { is_active: false } });

        const song = await prisma.song.create({
            data: {
                title,
                description: description || null,
                file_url: `/uploads/songs/${audioName}`,
                cover_url: `/uploads/covers/${coverName}`,
                distribution_links: distributionLinks || null,
                publisher_link: publisherLink || null,
                is_active: true,
            },
        });

        return NextResponse.json(song, { status: 201 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any)?.role !== 'ADMIN') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id, is_active } = await req.json();
        if (!id) return NextResponse.json({ message: 'ID required' }, { status: 400 });

        // Only one song active at a time
        if (is_active) {
            await prisma.song.updateMany({ data: { is_active: false } });
        }

        const updated = await prisma.song.update({ where: { id }, data: { is_active } });
        return NextResponse.json(updated);
    } catch {
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { storage } from '@/lib/storage';
import { songUpdateSchema } from '@/lib/validations';
import { z } from 'zod';
import { requireAdmin } from '@/app/api/_lib/admin';
import { optimizeImage } from '@/lib/imageOptimizer';

const ALLOWED_AUDIO = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mp4'];
const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_AUDIO_BYTES = 50 * 1024 * 1024; // 50MB
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;  // 5MB

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = session?.user?.role ?? null;
        const isAdmin = userRole === 'ADMIN';

        if (isAdmin) {
            const { searchParams } = new URL(req.url);
            const page = parseInt(searchParams.get('page') || '1');
            const limit = parseInt(searchParams.get('limit') || '10');
            const skip = (page - 1) * limit;

            const [songs, total] = await Promise.all([
                prisma.song.findMany({ 
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit,
                }),
                prisma.song.count(),
            ]);
            
            return NextResponse.json({ 
                songs, 
                pagination: { page, limit, total, pages: Math.ceil(total / limit) } 
            });
        }
        
        const song = await prisma.song.findFirst({ where: { is_active: true }, orderBy: { updatedAt: 'desc' } });
        return NextResponse.json(song);
    } catch (error) {
        console.error('Song fetch error:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { session } = await requireAdmin();
        if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const contentType = req.headers.get('content-type') || '';

        // Support direct S3 uploads: client uploads to S3 via presigned URL,
        // then sends JSON with final file URLs to create the DB record.
        if (contentType.includes('application/json')) {
            const body = await req.json();
            const { title, description, distributionLinks, publisherLink, fileUrl, coverUrl } = body;

            if (!title || !fileUrl || !coverUrl) {
                return NextResponse.json({ message: 'Title, file URL, and cover URL are required' }, { status: 400 });
            }

            await prisma.song.updateMany({ data: { is_active: false } });

            const song = await prisma.song.create({
                data: {
                    title,
                    description: description || null,
                    file_url: fileUrl,
                    cover_url: coverUrl,
                    distribution_links: distributionLinks || null,
                    publisher_link: publisherLink || null,
                    is_active: true,
                },
            });

            return NextResponse.json(song, { status: 201 });
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

        // Save files with the new storage utility
        const audioUrl = await storage.uploadFile(audioFile, 'songs');

        const coverBuffer = Buffer.from(await coverFile.arrayBuffer());
        const optimizedCover = await optimizeImage(coverBuffer, { maxWidth: 1200, maxHeight: 1200, quality: 80, format: 'webp' });
        const coverUrl = await storage.uploadFile(optimizedCover.buffer, 'covers', optimizedCover.format);

        // Deactivate others if setting active
        await prisma.song.updateMany({ data: { is_active: false } });

        const song = await prisma.song.create({
            data: {
                title,
                description: description || null,
                file_url: audioUrl,
                cover_url: coverUrl,
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
        const { session } = await requireAdmin();
        if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const validation = songUpdateSchema.safeParse(body);
        
        if (!validation.success) {
            return NextResponse.json({ 
                message: 'Invalid input', 
                errors: validation.error.issues 
            }, { status: 400 });
        }

        const { id, is_active } = validation.data;

        // Only one song active at a time
        if (is_active) {
            await prisma.song.updateMany({ data: { is_active: false } });
        }

        const updated = await prisma.song.update({ where: { id }, data: { is_active } });
        return NextResponse.json(updated);
    } catch (error) {
        console.error('Song update error:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { session } = await requireAdmin();
        if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { id } = z.object({ id: z.string().cuid() }).parse(body);

        const song = await prisma.song.findUnique({ where: { id } });
        if (song) {
            // Delete files using the storage utility
            await storage.deleteFile(song.file_url);
            await storage.deleteFile(song.cover_url);
        }

        await prisma.song.delete({ where: { id } });
        return NextResponse.json({ message: 'Song deleted' });
    } catch (error) {
        console.error('Song delete error:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

import { NextRequest } from 'next/server';
import { prisma } from '@/app/db';
import { auth } from '@/lib/auth';
import { storage } from '@/lib/storage';
import { songUpdateSchema } from '@/lib/validations';
import { z } from 'zod';
import { requireAdmin } from '@/app/api/_lib/admin';
import { optimizeImage } from '@/lib/imageOptimizer';
import { scanBuffer } from '@/lib/uploadScanner';
import { getRequestId, errorResponse, successResponse } from '@/lib/api';
import { recordRequest } from '@/lib/observability';

const ALLOWED_AUDIO = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mp4'];
const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_AUDIO_BYTES = 50 * 1024 * 1024; // 50MB
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;  // 5MB

const songCreateSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(500).optional().nullable(),
  fileUrl: z.string().url(),
  fileKey: z.string().optional(),
  coverUrl: z.string().url(),
  coverKey: z.string().optional(),
  distributionLinks: z.string().optional().nullable(),
  publisherLink: z.string().optional().nullable(),
});

const songDirectUploadSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().max(500).optional().nullable(),
  audioKey: z.string().regex(/^quarantine\/[A-Za-z0-9._-]+$/),
  audioContentType: z.string().refine((type) => ALLOWED_AUDIO.includes(type)),
  audioFilename: z.string().min(1).max(200),
  coverKey: z.string().regex(/^quarantine\/[A-Za-z0-9._-]+$/),
  coverContentType: z.string().refine((type) => ALLOWED_IMAGE.includes(type)),
  coverFilename: z.string().min(1).max(200),
  distributionLinks: z.string().optional().nullable(),
  publisherLink: z.string().optional().nullable(),
});

class SongUploadError extends Error {
    constructor(message: string, readonly status: number, readonly code: string) {
        super(message);
    }
}

async function finalizeDirectSongUpload(input: z.infer<typeof songDirectUploadSchema>) {
    let audioFinalKey: string | undefined;
    let coverFinalKey: string | undefined;
    let songCreated = false;

    try {
        const audioBuffer = await storage.downloadFile(input.audioKey);
        const coverBuffer = await storage.downloadFile(input.coverKey);
        if (audioBuffer.length === 0 || audioBuffer.length > MAX_AUDIO_BYTES) {
            throw new SongUploadError('Audio must be between 1 byte and 50MB', 400, 'AUDIO_TOO_LARGE');
        }
        if (coverBuffer.length === 0 || coverBuffer.length > MAX_IMAGE_BYTES) {
            throw new SongUploadError('Cover image must be between 1 byte and 5MB', 400, 'COVER_TOO_LARGE');
        }

        const [audioScan, coverScan] = await Promise.all([
            scanBuffer(audioBuffer, input.audioFilename),
            scanBuffer(coverBuffer, input.coverFilename),
        ]);
        if (!audioScan.clean) {
            throw new SongUploadError(`Audio rejected: ${audioScan.reason}`, 400, 'AUDIO_REJECTED');
        }
        if (!coverScan.clean) {
            throw new SongUploadError(`Cover rejected: ${coverScan.reason}`, 400, 'COVER_REJECTED');
        }

        const optimizedCover = await optimizeImage(coverBuffer, {
            maxWidth: 1200,
            maxHeight: 1200,
            quality: 80,
            format: 'webp',
        });
        const audio = await storage.uploadFile(audioBuffer, 'songs', input.audioContentType);
        audioFinalKey = audio.key;
        const cover = await storage.uploadFile(optimizedCover.buffer, 'covers', optimizedCover.format);
        coverFinalKey = cover.key;

        const [, song] = await prisma.$transaction([
            prisma.song.updateMany({ data: { is_active: false } }),
            prisma.song.create({
                data: {
                    title: input.title,
                    description: input.description || null,
                    file_url: audio.url,
                    file_key: audio.key,
                    cover_url: cover.url,
                    cover_key: cover.key,
                    distribution_links: input.distributionLinks || null,
                    publisher_link: input.publisherLink || null,
                    is_active: true,
                },
            }),
        ]);
        songCreated = true;
        return song;
    } finally {
        const cleanupKeys = [input.audioKey, input.coverKey];
        if (!songCreated) cleanupKeys.push(...[audioFinalKey, coverFinalKey].filter(
            (key): key is string => key !== undefined,
        ));
        for (const key of cleanupKeys) {
            try {
                await storage.deleteByKey(key);
            } catch (error) {
                console.error(`Failed to clean up uploaded media ${key}:`, error);
            }
        }
    }
}

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
            const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10) || 10));
            const skip = (page - 1) * limit;

            const [songs, total] = await Promise.all([
                prisma.song.findMany({ 
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit,
                }),
                prisma.song.count(),
            ]);
            
            recordRequest('GET', '/api/songs', 200, performance.now() - start, requestId);
            return successResponse({ 
                songs, 
                pagination: { page, limit, total, pages: Math.ceil(total / limit) } 
            });
        }
        
        const song = await prisma.song.findFirst({ where: { is_active: true }, orderBy: { updatedAt: 'desc' } });
        recordRequest('GET', '/api/songs', 200, performance.now() - start, requestId);
        return successResponse(song);
    } catch (error) {
        console.error('Song fetch error:', error);
        recordRequest('GET', '/api/songs', 500, performance.now() - start, requestId);
        return errorResponse('Server error', 500, 'SONG_FETCH_ERROR');
    }
}

export async function POST(req: NextRequest) {
    const requestId = getRequestId(req);
    const start = performance.now();
    try {
        const { session } = await requireAdmin();
        if (!session) {
            recordRequest('POST', '/api/songs', 401, performance.now() - start, requestId);
            return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
        }

        const contentType = req.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
            const body = await req.json();
            const directUpload = songDirectUploadSchema.safeParse(body);
            if (directUpload.success) {
                if (!storage.supportsPresign()) {
                    recordRequest('POST', '/api/songs', 501, performance.now() - start, requestId);
                    return errorResponse('Direct uploads require configured object storage', 501, 'NOT_IMPLEMENTED');
                }
                const song = await finalizeDirectSongUpload(directUpload.data);
                recordRequest('POST', '/api/songs', 201, performance.now() - start, requestId);
                return successResponse(song, 201);
            }

            const validation = songCreateSchema.safeParse(body);
            if (!validation.success) {
                recordRequest('POST', '/api/songs', 400, performance.now() - start, requestId);
                return errorResponse('Invalid input', 400, 'VALIDATION_ERROR', validation.error.issues);
            }

            const { title, description, distributionLinks, publisherLink, fileUrl, coverUrl, fileKey, coverKey } = validation.data;

            const [, song] = await prisma.$transaction([
                prisma.song.updateMany({ data: { is_active: false } }),
                prisma.song.create({
                    data: {
                        title,
                        description: description || null,
                        file_url: fileUrl,
                        file_key: fileKey || null,
                        cover_url: coverUrl,
                        cover_key: coverKey || null,
                        distribution_links: distributionLinks || null,
                        publisher_link: publisherLink || null,
                        is_active: true,
                    },
                }),
            ]);

            recordRequest('POST', '/api/songs', 201, performance.now() - start, requestId);
            return successResponse(song, 201);
        }

        const formData = await req.formData();
        const audioFile = formData.get('audio') as File | null;
        const coverFile = formData.get('cover') as File | null;
        const coverUrl = formData.get('coverUrl') as string | null;
        const title = (formData.get('title') as string ?? '').trim().slice(0, 120);
        const description = formData.get('description') as string ?? '';
        const distributionLinks = formData.get('distributionLinks') as string | null;
        const publisherLink = formData.get('publisherLink') as string | null;

        if (!audioFile || !title) {
            recordRequest('POST', '/api/songs', 400, performance.now() - start, requestId);
            return errorResponse('Audio file and title are required', 400, 'MISSING_FIELDS');
        }

        if (!coverFile && !coverUrl) {
            recordRequest('POST', '/api/songs', 400, performance.now() - start, requestId);
            return errorResponse('Cover image or cover URL is required', 400, 'MISSING_COVER');
        }

        if (!ALLOWED_AUDIO.includes(audioFile.type) && !audioFile.name.match(/\.(mp3|wav|ogg|m4a)$/i)) {
            recordRequest('POST', '/api/songs', 400, performance.now() - start, requestId);
            return errorResponse('Invalid audio format', 400, 'INVALID_AUDIO_FORMAT');
        }
        if (audioFile.size > MAX_AUDIO_BYTES) {
            recordRequest('POST', '/api/songs', 400, performance.now() - start, requestId);
            return errorResponse('Audio must be under 50MB', 400, 'AUDIO_TOO_LARGE');
        }

        const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
        const audioScan = await scanBuffer(audioBuffer, audioFile.name);
        if (!audioScan.clean) {
            recordRequest('POST', '/api/songs', 400, performance.now() - start, requestId);
            return errorResponse(`Audio rejected: ${audioScan.reason}`, 400, 'AUDIO_REJECTED');
        }

        const audioResult = await storage.uploadFile(audioFile, 'songs');
        const audioUrl = audioResult.url;
        const audioKey = audioResult.key;

        let finalCoverUrl = coverUrl;
        let finalCoverKey: string | undefined;
        if (!finalCoverUrl && coverFile) {
            if (!ALLOWED_IMAGE.includes(coverFile.type)) {
                recordRequest('POST', '/api/songs', 400, performance.now() - start, requestId);
                return errorResponse('Cover must be JPG, PNG, or WEBP', 400, 'INVALID_COVER_FORMAT');
            }
            if (coverFile.size > MAX_IMAGE_BYTES) {
                recordRequest('POST', '/api/songs', 400, performance.now() - start, requestId);
                return errorResponse('Cover image must be under 5MB', 400, 'COVER_TOO_LARGE');
            }

            const coverBuffer = Buffer.from(await coverFile.arrayBuffer());
            const coverScan = await scanBuffer(coverBuffer, coverFile.name);
            if (!coverScan.clean) {
                recordRequest('POST', '/api/songs', 400, performance.now() - start, requestId);
                return errorResponse(`Cover rejected: ${coverScan.reason}`, 400, 'COVER_REJECTED');
            }

            const optimizedCover = await optimizeImage(coverBuffer, { maxWidth: 1200, maxHeight: 1200, quality: 80, format: 'webp' });
            const coverResult = await storage.uploadFile(optimizedCover.buffer, 'covers', optimizedCover.format);
            finalCoverUrl = coverResult.url;
            finalCoverKey = coverResult.key;
        }

        if (!finalCoverUrl) {
            recordRequest('POST', '/api/songs', 400, performance.now() - start, requestId);
            return errorResponse('Cover image is required', 400, 'MISSING_COVER');
        }

        const [, song] = await prisma.$transaction([
            prisma.song.updateMany({ data: { is_active: false } }),
            prisma.song.create({
                data: {
                    title,
                    description: description || null,
                    file_url: audioUrl,
                    file_key: audioKey,
                    cover_url: finalCoverUrl,
                    cover_key: finalCoverKey,
                    distribution_links: distributionLinks || null,
                    publisher_link: publisherLink || null,
                    is_active: true,
                },
            }),
        ]);

        recordRequest('POST', '/api/songs', 201, performance.now() - start, requestId);
        return successResponse(song, 201);
    } catch (err) {
        console.error(err);
        if (err instanceof SongUploadError) {
            recordRequest('POST', '/api/songs', err.status, performance.now() - start, requestId);
            return errorResponse(err.message, err.status, err.code);
        }
        recordRequest('POST', '/api/songs', 500, performance.now() - start, requestId);
        return errorResponse('Server error', 500, 'SONG_CREATION_ERROR');
    }
}

export async function PATCH(req: NextRequest) {
    const requestId = getRequestId(req);
    const start = performance.now();
    try {
        const { session } = await requireAdmin();
        if (!session) {
            recordRequest('PATCH', '/api/songs', 401, performance.now() - start, requestId);
            return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
        }

        const body = await req.json();
        const validation = songUpdateSchema.safeParse(body);
        
        if (!validation.success) {
            recordRequest('PATCH', '/api/songs', 400, performance.now() - start, requestId);
            return errorResponse('Invalid input', 400, 'VALIDATION_ERROR', validation.error.issues);
        }

        const { id, is_active, title, description, distribution_links, publisher_link } = validation.data;

        if (is_active) {
            await prisma.$transaction([
                prisma.song.updateMany({ data: { is_active: false } }),
                prisma.song.update({ where: { id }, data: { is_active, title, description, distribution_links, publisher_link } }),
            ]);
        } else {
            const updated = await prisma.song.update({ where: { id }, data: { is_active, title, description, distribution_links, publisher_link } });
            recordRequest('PATCH', '/api/songs', 200, performance.now() - start, requestId);
            return successResponse(updated);
        }

        const updated = await prisma.song.findUnique({ where: { id } });
        recordRequest('PATCH', '/api/songs', 200, performance.now() - start, requestId);
        return successResponse(updated);
    } catch (error) {
        console.error('Song update error:', error);
        recordRequest('PATCH', '/api/songs', 500, performance.now() - start, requestId);
        return errorResponse('Server error', 500, 'SONG_UPDATE_ERROR');
    }
}

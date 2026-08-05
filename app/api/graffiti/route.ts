import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { auth } from '@/lib/auth';
import { storage } from '@/lib/storage';
import { graffitiUpdateSchema } from '@/lib/validations';
import { z } from 'zod';
import { getClientIp } from '@/lib/ip';
import { checkRateLimit } from '@/lib/ratelimit';
import { requireAdmin } from '@/app/api/_lib/admin';
import { optimizeImage } from '@/lib/imageOptimizer';
import { scanBuffer } from '@/lib/uploadScanner';
import { notifyAdminModeration } from '@/lib/moderation';
import { getRequestId, errorResponse, successResponse } from '@/lib/api';
import { recordRequest } from '@/lib/observability';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

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

            const [items, total] = await Promise.all([
                prisma.graffitiSubmission.findMany({ 
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit,
                }),
                prisma.graffitiSubmission.count(),
            ]);
            
            recordRequest('GET', '/api/graffiti', 200, performance.now() - start, requestId);
            return successResponse({ 
                items, 
                pagination: { page, limit, total, pages: Math.ceil(total / limit) } 
            });
        }

        const approved = await prisma.graffitiSubmission.findMany({
            where: { approved: true, OR: [{ display_until: null }, { display_until: { gte: new Date() } }] },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });
        recordRequest('GET', '/api/graffiti', 200, performance.now() - start, requestId);
        return successResponse(approved);
    } catch (error) {
        console.error('Graffiti fetch error:', error);
        recordRequest('GET', '/api/graffiti', 500, performance.now() - start, requestId);
        return errorResponse('Server error', 500, 'GRAFFITI_FETCH_ERROR');
    }
}

export async function POST(req: NextRequest) {
    const requestId = getRequestId(req);
    const start = performance.now();
    try {
        const ip = getClientIp(req);
        const key = `graffiti:${ip}`;
        const { allowed } = await checkRateLimit({ key, max: 3, periodSeconds: 60 });
        if (!allowed) {
            recordRequest('POST', '/api/graffiti', 429, performance.now() - start, requestId);
            return errorResponse('Too many uploads. Please wait.', 429, 'RATE_LIMIT_EXCEEDED');
        }

        const contentType = req.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
            const session = await auth();
            if (session?.user?.role !== 'ADMIN') {
                recordRequest('POST', '/api/graffiti', 401, performance.now() - start, requestId);
                return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
            }

            const body = await req.json();
            const { imageUrl, imageKey, artistName } = body;

            if (!imageUrl || !artistName) {
                recordRequest('POST', '/api/graffiti', 400, performance.now() - start, requestId);
                return errorResponse('Image URL and artist name are required', 400, 'MISSING_FIELDS');
            }

            const newGraffiti = await prisma.graffitiSubmission.create({
                data: {
                    image_url: imageUrl,
                    image_key: imageKey || null,
                    artist_name: artistName,
                },
            });

            notifyAdminModeration({ submissionType: 'graffiti', submissionId: newGraffiti.id, submittedBy: artistName }).catch(() => {});

            recordRequest('POST', '/api/graffiti', 201, performance.now() - start, requestId);
            return successResponse(newGraffiti, 201);
        }

        const formData = await req.formData();
        const file = formData.get('image') as File | null;
        const artistName = (formData.get('artistName') as string ?? '').trim().slice(0, 60);

        if (!file || !artistName) {
            recordRequest('POST', '/api/graffiti', 400, performance.now() - start, requestId);
            return errorResponse('Image and artist name required', 400, 'MISSING_FIELDS');
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
            recordRequest('POST', '/api/graffiti', 400, performance.now() - start, requestId);
            return errorResponse('Only JPG, PNG, WEBP allowed', 400, 'INVALID_IMAGE_FORMAT');
        }
        if (file.size > MAX_SIZE_BYTES) {
            recordRequest('POST', '/api/graffiti', 400, performance.now() - start, requestId);
            return errorResponse('Image must be under 5MB', 400, 'IMAGE_TOO_LARGE');
        }

        const imageBuffer = Buffer.from(await file.arrayBuffer());
        const scan = await scanBuffer(imageBuffer, file.name);
        if (!scan.clean) {
            recordRequest('POST', '/api/graffiti', 400, performance.now() - start, requestId);
            return errorResponse(`Image rejected: ${scan.reason}`, 400, 'IMAGE_REJECTED');
        }

        const optimized = await optimizeImage(imageBuffer, { maxWidth: 2000, maxHeight: 2000, quality: 80, format: 'webp' });
        const imageResult = await storage.uploadFile(optimized.buffer, 'graffiti', optimized.format);
        const imageUrl = imageResult.url;
        const imageKey = imageResult.key;

        const newGraffiti = await prisma.graffitiSubmission.create({
            data: {
                image_url: imageUrl,
                image_key: imageKey,
                artist_name: artistName,
                scan_clean: scan.clean,
                scan_result: scan.reason ?? null,
            },
        });

        notifyAdminModeration({ submissionType: 'graffiti', submissionId: newGraffiti.id, submittedBy: artistName }).catch(() => {});

        recordRequest('POST', '/api/graffiti', 201, performance.now() - start, requestId);
        return successResponse(newGraffiti, 201);
    } catch {
        recordRequest('POST', '/api/graffiti', 500, performance.now() - start, requestId);
        return errorResponse('Server error', 500, 'GRAFFITI_SUBMISSION_ERROR');
    }
}

export async function PATCH(req: NextRequest) {
    const requestId = getRequestId(req);
    const start = performance.now();
    try {
        const { session, error } = await requireAdmin();
        if (!session) {
            recordRequest('PATCH', '/api/graffiti', error!.status, performance.now() - start, requestId);
            return errorResponse(error!.message, error!.status, 'UNAUTHORIZED');
        }

        const body = await req.json();
        const validation = graffitiUpdateSchema.safeParse(body);
        
        if (!validation.success) {
            recordRequest('PATCH', '/api/graffiti', 400, performance.now() - start, requestId);
            return errorResponse('Invalid input', 400, 'VALIDATION_ERROR', validation.error.issues);
        }

        const { id, approved, display_until } = validation.data;

        const updated = await prisma.graffitiSubmission.update({
            where: { id },
            data: {
                ...(approved !== undefined ? { approved } : {}),
                ...(display_until !== undefined ? { display_until: display_until ? new Date(display_until) : null } : {}),
            },
        });

        recordRequest('PATCH', '/api/graffiti', 200, performance.now() - start, requestId);
        return successResponse(updated);
    } catch (error) {
        console.error('Graffiti update error:', error);
        recordRequest('PATCH', '/api/graffiti', 500, performance.now() - start, requestId);
        return errorResponse('Server error', 500, 'GRAFFITI_UPDATE_ERROR');
    }
}

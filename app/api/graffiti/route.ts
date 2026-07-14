import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { storage } from '@/lib/storage';
import { graffitiUpdateSchema } from '@/lib/validations';
import { z } from 'zod';
import { getClientIp } from '@/lib/ip';
import { checkRateLimit } from '@/lib/ratelimit';
import { requireAdmin } from '@/app/api/_lib/admin';
import { optimizeImage } from '@/lib/imageOptimizer';
import { scanBuffer } from '@/lib/uploadScanner';
import { notifyAdminModeration } from '@/lib/moderation';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
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
            
            return NextResponse.json({ 
                items, 
                pagination: { page, limit, total, pages: Math.ceil(total / limit) } 
            });
        }

        const approved = await prisma.graffitiSubmission.findMany({
            where: { approved: true, OR: [{ display_until: null }, { display_until: { gte: new Date() } }] },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });
        return NextResponse.json(approved);
    } catch (error) {
        console.error('Graffiti fetch error:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const ip = getClientIp(req);
        const key = `graffiti:${ip}`;
        const { allowed } = await checkRateLimit({ key, max: 3, periodSeconds: 60 });
        if (!allowed) {
            return NextResponse.json({ message: 'Too many uploads. Please wait.' }, { status: 429 });
        }

        const contentType = req.headers.get('content-type') || '';

        // JSON branch is admin-only: submit a pre-optimized URL produced by
        // the /api/uploads/optimize endpoint. Public users must use multipart.
        if (contentType.includes('application/json')) {
            const session = await getServerSession(authOptions);
            if (session?.user?.role !== 'ADMIN') {
                return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
            }

            const body = await req.json();
            const { imageUrl, artistName } = body;

            if (!imageUrl || !artistName) {
                return NextResponse.json({ message: 'Image URL and artist name are required' }, { status: 400 });
            }

            const newGraffiti = await prisma.graffitiSubmission.create({
                data: {
                    image_url: imageUrl,
                    artist_name: artistName,
                    scan_clean: true,
                },
            });

            notifyAdminModeration({ submissionType: 'graffiti', submissionId: newGraffiti.id, submittedBy: artistName }).catch(() => {});

            return NextResponse.json(newGraffiti, { status: 201 });
        }

        // Public multipart submission (scanned + optimized server-side).
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

        const imageBuffer = Buffer.from(await file.arrayBuffer());
        const scan = await scanBuffer(imageBuffer, file.name);
        if (!scan.clean) {
            return NextResponse.json({ message: `Image rejected: ${scan.reason}` }, { status: 400 });
        }

        const optimized = await optimizeImage(imageBuffer, { maxWidth: 2000, maxHeight: 2000, quality: 80, format: 'webp' });
        const imageUrl = await storage.uploadFile(optimized.buffer, 'graffiti', optimized.format);

        const newGraffiti = await prisma.graffitiSubmission.create({
            data: {
                image_url: imageUrl,
                artist_name: artistName,
                scan_clean: scan.clean,
                scan_result: scan.reason ?? null,
            },
        });

        notifyAdminModeration({ submissionType: 'graffiti', submissionId: newGraffiti.id, submittedBy: artistName }).catch(() => {});

        return NextResponse.json(newGraffiti, { status: 201 });
    } catch {
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const { session } = await requireAdmin();
        if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const validation = graffitiUpdateSchema.safeParse(body);
        
        if (!validation.success) {
            return NextResponse.json({ 
                message: 'Invalid input', 
                errors: validation.error.issues 
            }, { status: 400 });
        }

        const { id, approved, display_until } = validation.data;

        const updated = await prisma.graffitiSubmission.update({
            where: { id },
            data: {
                ...(approved !== undefined ? { approved } : {}),
                ...(display_until !== undefined ? { display_until: display_until ? new Date(display_until) : null } : {}),
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Graffiti update error:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { session } = await requireAdmin();
        if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { id } = z.object({ id: z.string().cuid() }).parse(body);

        const graffiti = await prisma.graffitiSubmission.findUnique({ where: { id } });
        if (graffiti) {
            await storage.deleteFile(graffiti.image_url);
        }

        await prisma.graffitiSubmission.delete({ where: { id } });
        return NextResponse.json({ message: 'Graffiti deleted' });
    } catch (error) {
        console.error('Graffiti delete error:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

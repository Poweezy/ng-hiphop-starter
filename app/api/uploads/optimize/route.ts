import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAdmin } from '@/app/api/_lib/admin';
import { storage } from '@/lib/storage';
import { optimizeImage } from '@/lib/imageOptimizer';
import { scanBuffer } from '@/lib/uploadScanner';
import { getRequestId, errorResponse, successResponse } from '@/lib/api';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(req: NextRequest) {
    const requestId = getRequestId(req);
    try {
        const { session } = await requireAdmin();
        if (!session) return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');

        const contentType = req.headers.get('content-type') || '';

        if (!contentType.includes('multipart/form-data')) {
            return errorResponse('Expected multipart/form-data', 400, 'INVALID_CONTENT_TYPE');
        }

        const formData = await req.formData();
        const file = formData.get('image') as File | null;
        const folder = (formData.get('folder') as string | null) || 'uploads';

        if (!file) {
            return errorResponse('Image file is required', 400, 'MISSING_FILE');
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return errorResponse('Only JPG, PNG, WEBP allowed', 400, 'INVALID_IMAGE_FORMAT');
        }

        if (file.size > MAX_IMAGE_BYTES) {
            return errorResponse('Image must be under 5MB', 400, 'IMAGE_TOO_LARGE');
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const scanResult = await scanBuffer(buffer, file.name);
        if (!scanResult.clean) {
            return errorResponse(`File rejected: ${scanResult.reason}`, 400, 'FILE_REJECTED');
        }

        const optimized = await optimizeImage(buffer, { maxWidth: 2000, maxHeight: 2000, quality: 80, format: 'webp' });

        const url = await storage.uploadFile(optimized.buffer, folder, optimized.format);

        return successResponse({ url, width: optimized.width, height: optimized.height });
    } catch (error) {
        console.error('Image optimization error:', error);
        return errorResponse('Server error', 500, 'IMAGE_OPTIMIZATION_ERROR');
    }
}

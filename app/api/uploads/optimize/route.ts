import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAdmin } from '@/app/api/_lib/admin';
import { storage } from '@/lib/storage';
import { optimizeImage } from '@/lib/imageOptimizer';
import { scanBuffer } from '@/lib/uploadScanner';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(req: NextRequest) {
    try {
        const { session } = await requireAdmin();
        if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const contentType = req.headers.get('content-type') || '';

        if (!contentType.includes('multipart/form-data')) {
            return NextResponse.json({ message: 'Expected multipart/form-data' }, { status: 400 });
        }

        const formData = await req.formData();
        const file = formData.get('image') as File | null;
        const folder = (formData.get('folder') as string | null) || 'uploads';

        if (!file) {
            return NextResponse.json({ message: 'Image file is required' }, { status: 400 });
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json({ message: 'Only JPG, PNG, WEBP allowed' }, { status: 400 });
        }

        if (file.size > MAX_IMAGE_BYTES) {
            return NextResponse.json({ message: 'Image must be under 5MB' }, { status: 400 });
        }

        // Scan for malware
        const buffer = Buffer.from(await file.arrayBuffer());
        const scanResult = await scanBuffer(buffer, file.name);
        if (!scanResult.clean) {
            return NextResponse.json({ message: `File rejected: ${scanResult.reason}` }, { status: 400 });
        }

        // Optimize image
        const optimized = await optimizeImage(buffer, { maxWidth: 2000, maxHeight: 2000, quality: 80, format: 'webp' });

        // Upload to storage
        const url = await storage.uploadFile(optimized.buffer, folder, optimized.format);

        return NextResponse.json({ url, width: optimized.width, height: optimized.height });
    } catch (error) {
        console.error('Image optimization error:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

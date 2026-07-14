import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { storage } from '@/lib/storage';
import { z } from 'zod';

const presignSchema = z.object({
  folder: z.string().min(1).max(100),
  contentType: z.string().min(1).max(100),
  filename: z.string().max(200).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = session?.user?.role ?? null;
    if (!session || userRole !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = presignSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: validation.error.issues },
        { status: 400 }
      );
    }

    const { folder, contentType, filename } = validation.data;

    // If S3 is not configured, presigned uploads are not available.
    if (!storage.supportsPresign()) {
      return NextResponse.json(
        { message: 'Presigned uploads require S3 configuration' },
        { status: 501 }
      );
    }

    const result = await storage.getPresignedUploadUrl(folder, contentType, filename);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Presign upload error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

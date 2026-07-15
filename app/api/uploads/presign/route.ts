import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { storage } from '@/lib/storage';
import { z } from 'zod';
import { getRequestId, errorResponse, successResponse } from '@/lib/api';

const presignSchema = z.object({
  folder: z.string().min(1).max(100),
  contentType: z.string().min(1).max(100),
  filename: z.string().max(200).optional(),
});

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req);
  try {
    const session = await getServerSession(authOptions);
    const userRole = session?.user?.role ?? null;
    if (!session || userRole !== 'ADMIN') {
      return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const body = await req.json();
    const validation = presignSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse('Invalid input', 400, 'VALIDATION_ERROR', validation.error.issues);
    }

    const { folder, contentType, filename } = validation.data;

    if (!storage.supportsPresign()) {
      return errorResponse('Presigned uploads require S3 configuration', 501, 'NOT_IMPLEMENTED');
    }

    const result = await storage.getPresignedUploadUrl(folder, contentType, filename);

    return successResponse(result);
  } catch (error) {
    console.error('Presign upload error:', error);
    return errorResponse('Server error', 500, 'PRESIGN_ERROR');
  }
}

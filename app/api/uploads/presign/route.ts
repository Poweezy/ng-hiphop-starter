import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { storage } from '@/lib/storage';
import { z } from 'zod';
import { getRequestId, errorResponse, successResponse } from '@/lib/api';
import { recordRequest } from '@/lib/observability';

const presignSchema = z.object({
  folder: z.string().min(1).max(100),
  contentType: z.string().min(1).max(100),
  filename: z.string().max(200).optional(),
});

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req);
  const start = performance.now();
  try {
    const session = await auth();
    const userRole = session?.user?.role ?? null;
    if (!session || userRole !== 'ADMIN') {
      recordRequest('POST', '/api/uploads/presign', 401, performance.now() - start, requestId);
      return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const body = await req.json();
    const validation = presignSchema.safeParse(body);

    if (!validation.success) {
      recordRequest('POST', '/api/uploads/presign', 400, performance.now() - start, requestId);
      return errorResponse('Invalid input', 400, 'VALIDATION_ERROR', validation.error.issues);
    }

    const { folder, contentType, filename } = validation.data;

    if (!storage.supportsPresign()) {
      recordRequest('POST', '/api/uploads/presign', 501, performance.now() - start, requestId);
      return errorResponse('Presigned upload URLs require S3 configuration', 501, 'NOT_IMPLEMENTED');
    }

    const result = await storage.getPresignedUploadUrl(folder, contentType, filename);

    recordRequest('POST', '/api/uploads/presign', 200, performance.now() - start, requestId);
    return successResponse(result);
  } catch (error) {
    console.error('Presign upload error:', error);
    recordRequest('POST', '/api/uploads/presign', 500, performance.now() - start, requestId);
    return errorResponse('Server error', 500, 'PRESIGN_ERROR');
  }
}

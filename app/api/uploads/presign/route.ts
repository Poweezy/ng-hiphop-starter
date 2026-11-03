import { NextRequest } from 'next/server';
import { requireAdmin } from '@/app/api/_lib/admin';
import { storage } from '@/lib/storage';
import { z } from 'zod';
import { getRequestId, errorResponse, successResponse } from '@/lib/api';
import { recordRequest } from '@/lib/observability';

const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/mp4',
];

const presignSchema = z.object({
  folder: z.literal('quarantine'),
  contentType: z.string().min(1).max(100),
  filename: z.string().max(200).optional(),
}).superRefine((data, ctx) => {
  if (!ALLOWED_CONTENT_TYPES.includes(data.contentType)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Content type "${data.contentType}" is not allowed. Allowed types: ${ALLOWED_CONTENT_TYPES.join(', ')}`,
      path: ['contentType'],
    });
  }
});

const cleanupSchema = z.object({
  keys: z.array(z.string().regex(/^quarantine\/[A-Za-z0-9._-]+$/)).min(1).max(2),
});

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req);
  const start = performance.now();
  try {
    const { session } = await requireAdmin();
    if (!session) {
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

export async function DELETE(req: NextRequest) {
  const requestId = getRequestId(req);
  const start = performance.now();
  try {
    const { session } = await requireAdmin();
    if (!session) {
      recordRequest('DELETE', '/api/uploads/presign', 401, performance.now() - start, requestId);
      return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const validation = cleanupSchema.safeParse(await req.json());
    if (!validation.success) {
      recordRequest('DELETE', '/api/uploads/presign', 400, performance.now() - start, requestId);
      return errorResponse('Invalid cleanup request', 400, 'VALIDATION_ERROR', validation.error.issues);
    }

    await Promise.all(validation.data.keys.map((key) => storage.deleteByKey(key)));
    recordRequest('DELETE', '/api/uploads/presign', 204, performance.now() - start, requestId);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Temporary upload cleanup error:', error);
    recordRequest('DELETE', '/api/uploads/presign', 500, performance.now() - start, requestId);
    return errorResponse('Temporary upload cleanup failed', 500, 'UPLOAD_CLEANUP_ERROR');
  }
}

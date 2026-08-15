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
  'image/gif',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/flac',
  'audio/aac',
  'audio/mp4',
  'audio/x-m4a',
];

const presignSchema = z.object({
  folder: z.string().min(1).max(100),
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

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';

export type ApiError = {
  code: string;
  message: string;
  details?: unknown;
};

export type ApiResponse<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: ApiError;
};

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data } as ApiResponse<T>, { status });
}

export function errorResponse(message: string, status = 500, code = 'INTERNAL_ERROR', details?: unknown) {
  const body: ApiResponse<never> = {
    success: false,
    error: { code, message, details },
  };
  return NextResponse.json(body, { status });
}

export function getRequestId(req: NextRequest): string {
  const existing = req.headers.get('x-request-id');
  if (existing) return existing;
  return crypto.randomUUID();
}

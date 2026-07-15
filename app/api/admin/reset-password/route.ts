import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import bcrypt from 'bcryptjs';
import { getClientIp } from '@/lib/ip';
import { checkRateLimit } from '@/lib/ratelimit';
import crypto from 'node:crypto';
import { getRequestId, errorResponse, successResponse } from '@/lib/api';

// Constant-time comparison against the configured master secret. We compare
// the raw value directly instead of caching a module-level bcrypt hash, which
// previously survived forever in long-running processes and could not rotate.
function isMasterSecretValid(provided: string): boolean {
  const expected = process.env.ADMIN_RESET_SECRET;
  if (!expected) {
    throw new Error('ADMIN_RESET_SECRET is not configured');
  }
  const a = Buffer.from(provided.trim());
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req);
  try {
    const ip = getClientIp(req);
    const key = `reset-password:${ip}`;
    const { allowed } = await checkRateLimit({ key, max: 3, periodSeconds: 300 });
    if (!allowed) {
      return errorResponse('Too many attempts. Please wait.', 429, 'RATE_LIMIT_EXCEEDED');
    }

    const { email, resetSecret, newPassword } = await req.json();

    if (!email || !resetSecret || !newPassword) {
      return errorResponse('All fields are required', 400, 'MISSING_FIELDS');
    }

    if (!isMasterSecretValid(resetSecret)) {
      return errorResponse('Invalid reset secret or admin email', 403, 'INVALID_RESET_SECRET');
    }

    if (newPassword.length < 8) {
      return errorResponse('New password must be at least 8 characters long', 400, 'PASSWORD_TOO_SHORT');
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Invalid reset secret or admin email', 403, 'INVALID_RESET_SECRET');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { password_hash: hashedPassword, tokenVersion: { increment: 1 } },
    });

    return successResponse({ message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return errorResponse('Internal server error', 500, 'PASSWORD_RESET_ERROR');
  }
}

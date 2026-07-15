import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import bcrypt from 'bcryptjs';
import { getClientIp } from '@/lib/ip';
import { checkRateLimit } from '@/lib/ratelimit';
import crypto from 'crypto';

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
  try {
    const ip = getClientIp(req);
    const key = `reset-password:${ip}`;
    const { allowed } = await checkRateLimit({ key, max: 3, periodSeconds: 300 });
    if (!allowed) {
      return NextResponse.json({ error: 'Too many attempts. Please wait.' }, { status: 429 });
    }

    const { email, resetSecret, newPassword } = await req.json();

    if (!email || !resetSecret || !newPassword) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Generic error for both invalid secret and unknown admin to avoid an
    // account-enumeration oracle.
    if (!isMasterSecretValid(resetSecret)) {
      return NextResponse.json({ error: 'Invalid reset secret or admin email' }, { status: 403 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters long' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Invalid reset secret or admin email' }, { status: 403 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { password_hash: hashedPassword, tokenVersion: { increment: 1 } },
    });

    // NOTE: existing sessions are not invalidated here. To fully revoke active
    // JWTs, add a token-version column to User and check it in the JWT callback.
    return NextResponse.json({ message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

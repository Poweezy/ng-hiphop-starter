import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import bcrypt from 'bcryptjs';
import { getClientIp } from '@/lib/ip';
import { checkRateLimit } from '@/lib/ratelimit';

let masterSecretHash: string | null = null;

async function getMasterSecretHash(): Promise<string> {
    if (masterSecretHash) return masterSecretHash;

    const secret = process.env.ADMIN_RESET_SECRET;
    if (!secret) {
        throw new Error('ADMIN_RESET_SECRET is not configured');
    }

    masterSecretHash = await bcrypt.hash(secret, 10);
    return masterSecretHash;
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

        const expectedHash = await getMasterSecretHash();
        const isValid = await bcrypt.compare(resetSecret, expectedHash);

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid reset secret key' }, { status: 403 });
        }

        if (newPassword.length < 8) {
            return NextResponse.json({ error: 'New password must be at least 8 characters long' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
        });

        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);

        await prisma.user.update({
            where: { id: user.id },
            data: { password_hash: hashedPassword },
        });

        return NextResponse.json({ message: 'Password reset successful. You can now log in.' });
    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

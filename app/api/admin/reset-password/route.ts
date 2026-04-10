import { NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        const { email, resetSecret, newPassword } = await req.json();

        if (!email || !resetSecret || !newPassword) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        const masterSecret = process.env.ADMIN_RESET_SECRET;

        if (!masterSecret) {
            return NextResponse.json({ error: 'Reset functionality is not configured' }, { status: 500 });
        }

        if (resetSecret !== masterSecret) {
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

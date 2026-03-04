import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  try {
    const slogan = await prisma.slogan.findUnique({ where: { id: 1 } });
    return NextResponse.json({ text: slogan?.text ?? 'Built From Bars. Raised By Beats.' });
  } catch {
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const text = typeof body.slogan === 'string' ? body.slogan.trim() : '';
    if (!text || text.length > 200) {
      return NextResponse.json({ message: 'Invalid slogan' }, { status: 400 });
    }
    const updated = await prisma.slogan.upsert({
      where: { id: 1 },
      update: { text },
      create: { id: 1, text },
    });
    return NextResponse.json({ message: 'Slogan updated', text: updated.text });
  } catch {
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

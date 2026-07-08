import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { sloganUpdateSchema } from '@/lib/validations';
import { requireAdmin } from '@/app/api/_lib/admin';

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
    const { session } = await requireAdmin();
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    
    const body = await req.json();
    const validation = sloganUpdateSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ 
        message: 'Invalid input', 
        errors: validation.error.issues 
      }, { status: 400 });
    }
    
    const { slogan } = validation.data;
    
    const updated = await prisma.slogan.upsert({
      where: { id: 1 },
      update: { text: slogan },
      create: { id: 1, text: slogan },
    });
    return NextResponse.json({ message: 'Slogan updated', text: updated.text });
  } catch (error) {
    console.error('Slogan update error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

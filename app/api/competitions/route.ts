import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { requireAdmin } from '@/app/api/_lib/admin';
import { competitionCreateSchema } from '@/lib/validations';
import { getRequestId, errorResponse, successResponse } from '@/lib/api';
import { recordRequest } from '@/lib/observability';

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req);
  const start = performance.now();
  try {
    const { session, error } = await requireAdmin();
    if (!session) {
      recordRequest('GET', '/api/competitions', error!.status, performance.now() - start, requestId);
      return errorResponse(error!.message, error!.status, 'UNAUTHORIZED');
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));
    const skip = (page - 1) * limit;

    const [competitions, total] = await Promise.all([
      prisma.lyricCompetition.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              lyrics: true,
              subscribers: true,
            },
          },
        },
      }),
      prisma.lyricCompetition.count(),
    ]);

    recordRequest('GET', '/api/competitions', 200, performance.now() - start, requestId);
    return successResponse({
      competitions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Competition fetch error:', error);
    recordRequest('GET', '/api/competitions', 500, performance.now() - start, requestId);
    return errorResponse('Server error', 500, 'COMPETITION_FETCH_ERROR');
  }
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req);
  const start = performance.now();
  try {
    const { session, error } = await requireAdmin();
    if (!session) {
      recordRequest('POST', '/api/competitions', error!.status, performance.now() - start, requestId);
      return errorResponse(error!.message, error!.status, 'UNAUTHORIZED');
    }

    const body = await req.json();
    const validation = competitionCreateSchema.safeParse(body);
    if (!validation.success) {
      recordRequest('POST', '/api/competitions', 400, performance.now() - start, requestId);
      return errorResponse('Invalid input', 400, 'VALIDATION_ERROR', validation.error.issues);
    }

    const { title, period, startDate, endDate, is_active } = validation.data;

    const competition = await prisma.lyricCompetition.create({
      data: {
        title,
        period,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        is_active: is_active ?? false,
      },
    });

    recordRequest('POST', '/api/competitions', 201, performance.now() - start, requestId);
    return successResponse(competition, 201);
  } catch (error) {
    console.error('Competition create error:', error);
    recordRequest('POST', '/api/competitions', 500, performance.now() - start, requestId);
    return errorResponse('Server error', 500, 'COMPETITION_CREATE_ERROR');
  }
}

import { NextRequest } from 'next/server';
import { prisma } from '@/app/db';
import { requireAdmin } from '@/app/api/_lib/admin';
import { competitionRuleSchema } from '@/lib/validations';
import { getRequestId, errorResponse, successResponse } from '@/lib/api';
import { recordRequest } from '@/lib/observability';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req);
  const start = performance.now();
  const { id } = await params;
  try {
    const { session, error } = await requireAdmin();
    if (!session) {
      recordRequest('GET', `/api/competitions/${id}/rules`, error!.status, performance.now() - start, requestId);
      return errorResponse(error!.message, error!.status, 'UNAUTHORIZED');
    }

    const rules = await prisma.competitionRule.findUnique({
      where: { competitionId: id },
    });

    recordRequest('GET', `/api/competitions/${id}/rules`, 200, performance.now() - start, requestId);
    return successResponse(rules);
  } catch (error) {
    console.error('Rules fetch error:', error);
    recordRequest('GET', `/api/competitions/${id}/rules`, 500, performance.now() - start, requestId);
    return errorResponse('Server error', 500, 'RULES_FETCH_ERROR');
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req);
  const start = performance.now();
  const { id } = await params;
  try {
    const { session, error } = await requireAdmin();
    if (!session) {
      recordRequest('PUT', `/api/competitions/${id}/rules`, error!.status, performance.now() - start, requestId);
      return errorResponse(error!.message, error!.status, 'UNAUTHORIZED');
    }

    const body = await req.json();
    const validation = competitionRuleSchema.safeParse(body);
    if (!validation.success) {
      recordRequest('PUT', `/api/competitions/${id}/rules`, 400, performance.now() - start, requestId);
      return errorResponse('Invalid input', 400, 'VALIDATION_ERROR', validation.error.issues);
    }

    const data = validation.data;

    const rules = await prisma.competitionRule.upsert({
      where: { competitionId: id },
      update: {
        minLength: data.minLength,
        maxLength: data.maxLength,
        originalityRequired: data.originalityRequired,
        copyrightRequirements: data.copyrightRequirements,
        maxSubmissionsPerUser: data.maxSubmissionsPerUser,
        eligibilityRequirements: data.eligibilityRequirements,
        ageRestriction: data.ageRestriction,
        moderationRequired: data.moderationRequired,
      },
      create: {
        competitionId: id,
        minLength: data.minLength,
        maxLength: data.maxLength,
        originalityRequired: data.originalityRequired,
        copyrightRequirements: data.copyrightRequirements,
        maxSubmissionsPerUser: data.maxSubmissionsPerUser,
        eligibilityRequirements: data.eligibilityRequirements,
        ageRestriction: data.ageRestriction,
        moderationRequired: data.moderationRequired,
      },
    });

    recordRequest('PUT', `/api/competitions/${id}/rules`, 200, performance.now() - start, requestId);
    return successResponse(rules);
  } catch (error) {
    console.error('Rules update error:', error);
    recordRequest('PUT', `/api/competitions/${id}/rules`, 500, performance.now() - start, requestId);
    return errorResponse('Server error', 500, 'RULES_UPDATE_ERROR');
  }
}

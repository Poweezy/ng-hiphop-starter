import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { requireAdmin } from '@/app/api/_lib/admin';
import { getRequestId, errorResponse, successResponse } from '@/lib/api';
import { recordRequest } from '@/lib/observability';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req);
  const start = performance.now();
  const { id } = await params;
  try {
    const { session, error } = await requireAdmin();
    if (!session) {
      recordRequest('PATCH', `/api/subscribers/${id}`, error!.status, performance.now() - start, requestId);
      return errorResponse(error!.message, error!.status, 'UNAUTHORIZED');
    }

    const body = await req.json();
    const { name, subscriptionStatus, consentStatus } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (subscriptionStatus !== undefined) updateData.subscriptionStatus = subscriptionStatus;
    if (consentStatus !== undefined) {
      updateData.consentStatus = consentStatus;
      updateData.consentTimestamp = new Date();
    }

    const subscriber = await prisma.subscriber.update({
      where: { id },
      data: updateData,
    });

    recordRequest('PATCH', `/api/subscribers/${id}`, 200, performance.now() - start, requestId);
    return successResponse(subscriber);
  } catch (error) {
    console.error('Subscriber update error:', error);
    recordRequest('PATCH', `/api/subscribers/${id}`, 500, performance.now() - start, requestId);
    return errorResponse('Server error', 500, 'SUBSCRIBER_UPDATE_ERROR');
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(req);
  const start = performance.now();
  const { id } = await params;
  try {
    const { session, error } = await requireAdmin();
    if (!session) {
      recordRequest('DELETE', `/api/subscribers/${id}`, error!.status, performance.now() - start, requestId);
      return errorResponse(error!.message, error!.status, 'UNAUTHORIZED');
    }

    await prisma.subscriber.update({
      where: { id },
      data: {
        subscriptionStatus: 'unsubscribed',
        unsubscribedAt: new Date(),
        email: `deleted-${id}@anonymized.local`,
        name: null,
      },
    });

    recordRequest('DELETE', `/api/subscribers/${id}`, 204, performance.now() - start, requestId);
    return NextResponse.json(null, { status: 204 });
  } catch (error) {
    console.error('Subscriber delete error:', error);
    recordRequest('DELETE', `/api/subscribers/${id}`, 500, performance.now() - start, requestId);
    return errorResponse('Server error', 500, 'SUBSCRIBER_DELETE_ERROR');
  }
}

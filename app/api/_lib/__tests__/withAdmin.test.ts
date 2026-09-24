import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const authMock = vi.fn();
vi.mock('@/lib/auth', () => ({ auth: (...args: unknown[]) => authMock(...args) }));

import { withAdmin } from '@/app/api/_lib/withAdmin';
import { successResponse } from '@/lib/api';

function makeReq(method = 'GET', path = '/api/admin/things') {
  return new NextRequest(`http://localhost:3000${path}`, { method });
}

describe('withAdmin', () => {
  beforeEach(() => {
    authMock.mockReset();
  });

  it('calls the handler with session when authenticated as ADMIN', async () => {
    const session = { user: { id: 'u1', role: 'ADMIN' } } as never;
    authMock.mockResolvedValue(session);

    const handler = vi.fn(async () => successResponse({ ok: true }));
    const res = await withAdmin(handler)(makeReq());

    expect(handler).toHaveBeenCalledOnce();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it('returns 401 and skips the handler when unauthenticated', async () => {
    authMock.mockResolvedValue(null);

    const handler = vi.fn(async () => successResponse({ ok: true }));
    const res = await withAdmin(handler)(makeReq('POST'));

    expect(handler).not.toHaveBeenCalled();
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 and skips the handler when role is not ADMIN', async () => {
    authMock.mockResolvedValue({ user: { id: 'u2', role: 'USER' } } as never);

    const handler = vi.fn(async () => successResponse({ ok: true }));
    const res = await withAdmin(handler)(makeReq('DELETE'));

    expect(handler).not.toHaveBeenCalled();
    expect(res.status).toBe(401);
  });

  it('resolves dynamic route params and passes them to the handler', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never);

    let receivedParams: unknown;
    const handler = withAdmin<{ id: string }>(async ({ params }) => {
      receivedParams = params;
      return successResponse({ id: params.id });
    });

    const res = await handler(
      makeReq('PATCH', '/api/subscribers/abc-123'),
      { params: Promise.resolve({ id: 'abc-123' }) },
    );

    expect(receivedParams).toEqual({ id: 'abc-123' });
    expect(res.status).toBe(200);
    expect((await res.json()).data).toEqual({ id: 'abc-123' });
  });

  it('records the actual handler response status', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never);

    const handler = withAdmin(async () => successResponse({ created: true }, 201));
    const res = await handler(makeReq('POST'));

    expect(res.status).toBe(201);
  });

  it('converts uncaught handler errors into a 500 JSON response', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as never);

    const handler = withAdmin(async () => {
      throw new Error('boom');
    });
    const res = await handler(makeReq());

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('INTERNAL_ERROR');
  });
});
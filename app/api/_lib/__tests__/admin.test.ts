import { describe, it, expect, vi, beforeEach } from 'vitest';

const authMock = vi.fn();
vi.mock('@/lib/auth', () => ({ auth: (...args: unknown[]) => authMock(...args) }));

import { requireAdmin } from '@/app/api/_lib/admin';

describe('requireAdmin', () => {
  beforeEach(() => {
    authMock.mockReset();
  });

  it('returns session for an authenticated ADMIN', async () => {
    const session = { user: { id: 'u1', email: 'a@b.c', role: 'ADMIN' } };
    authMock.mockResolvedValue(session);
    const { session: s, error } = await requireAdmin();
    expect(error).toBeNull();
    expect(s).toEqual(session);
  });

  it('returns 401 when unauthenticated', async () => {
    authMock.mockResolvedValue(null);
    const { session, error } = await requireAdmin();
    expect(session).toBeNull();
    expect(error?.status).toBe(401);
  });

  it('returns 401 when role is not ADMIN', async () => {
    authMock.mockResolvedValue({ user: { id: 'u2', role: 'USER' } });
    const { session, error } = await requireAdmin();
    expect(session).toBeNull();
    expect(error?.status).toBe(401);
  });

  it('returns 401 when role is missing', async () => {
    authMock.mockResolvedValue({ user: { id: 'u3' } });
    const { session, error } = await requireAdmin();
    expect(session).toBeNull();
    expect(error?.status).toBe(401);
  });
});
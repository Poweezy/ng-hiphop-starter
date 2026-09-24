import { describe, it, expect, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import type { User } from 'next-auth';
import { verifyAdminCredentials } from '@/lib/credentials';

const req = new Request('http://localhost:3000/api/auth/callback/credentials');

function makeDeps(overrides: Partial<Parameters<typeof verifyAdminCredentials>[2]> = {}) {
  const findUser = vi.fn().mockResolvedValue(null);
  const checkLimit = vi.fn().mockResolvedValue({ allowed: true });
  const deps = { findUser, checkLimit, clientIp: '127.0.0.1', ...overrides } as NonNullable<Parameters<typeof verifyAdminCredentials>[2]>;
  return { deps, findUser, checkLimit };
}

const adminRow = {
  id: 'u1',
  email: 'admin@ng.com',
  role: 'ADMIN',
  password_hash: '',
  tokenVersion: 0,
};

describe('verifyAdminCredentials', () => {
  it('authenticates a valid admin with correct password', async () => {
    const { deps, findUser, checkLimit } = makeDeps();
    findUser.mockResolvedValue({
      ...adminRow,
      password_hash: await bcrypt.hash('correct-password', 4),
    });
    const user = await verifyAdminCredentials(
      { email: 'admin@ng.com', password: 'correct-password' },
      req,
      deps,
    );
    expect(user).toMatchObject({ id: 'u1', email: 'admin@ng.com', role: 'ADMIN' });
  });

  it('rejects a wrong password', async () => {
    const { deps, findUser, checkLimit } = makeDeps();
    findUser.mockResolvedValue({
      ...adminRow,
      password_hash: await bcrypt.hash('correct-password', 4),
    });
    const user = await verifyAdminCredentials(
      { email: 'admin@ng.com', password: 'wrong' },
      req,
      deps,
    );
    expect(user).toBeNull();
  });

  it('rejects users without the ADMIN role', async () => {
    const { deps, findUser, checkLimit } = makeDeps();
    findUser.mockResolvedValue({
      ...adminRow,
      role: 'USER',
      password_hash: await bcrypt.hash('correct-password', 4),
    });
    const user = await verifyAdminCredentials(
      { email: 'admin@ng.com', password: 'correct-password' },
      req,
      deps,
    );
    expect(user).toBeNull();
  });

  it('rejects unknown emails without leaking existence', async () => {
    const { deps, findUser, checkLimit } = makeDeps();
    const user = await verifyAdminCredentials(
      { email: 'nobody@ng.com', password: 'whatever' },
      req,
      deps,
    );
    expect(user).toBeNull();
  });

  it('rejects when rate limited before touching the database', async () => {
    const { deps, findUser, checkLimit } = makeDeps();
    checkLimit.mockResolvedValue({ allowed: false });
    const user = await verifyAdminCredentials(
      { email: 'admin@ng.com', password: 'correct-password' },
      req,
      deps,
    );
    expect(user).toBeNull();
    expect(deps.findUser).not.toHaveBeenCalled();
  });

  it('rejects missing credentials', async () => {
    const { deps, findUser, checkLimit } = makeDeps();
    expect(await verifyAdminCredentials(undefined, req, deps)).toBeNull();
    expect(await verifyAdminCredentials({ email: 'a@b.c' }, req, deps)).toBeNull();
    expect(await verifyAdminCredentials({ password: 'x' }, req, deps)).toBeNull();
  });

  it('normalizes the email before lookup', async () => {
    const { deps, findUser, checkLimit } = makeDeps();
    await verifyAdminCredentials(
      { email: '  ADMIN@NG.com ', password: 'x' },
      req,
      deps,
    );
    expect(deps.findUser).toHaveBeenCalledWith('admin@ng.com');
  });

  it('rate-limit key includes ip and email', async () => {
    const { deps, findUser, checkLimit } = makeDeps();
    await verifyAdminCredentials(
      { email: 'admin@ng.com', password: 'x' },
      req,
      deps,
    );
    expect(deps.checkLimit).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'login:127.0.0.1:admin@ng.com', max: 5, periodSeconds: 900 }),
    );
  });
});

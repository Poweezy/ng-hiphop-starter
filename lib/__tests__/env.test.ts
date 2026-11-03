import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('validateEnv', () => {
  it('accepts a PostgreSQL database URL', async () => {
    vi.stubEnv(
      'DATABASE_URL',
      'postgresql://test:test@localhost:5432/ng_hiphop?sslmode=require',
    );
    vi.stubEnv('NEXTAUTH_SECRET', 'a-valid-test-secret-at-least-32-chars');
    vi.stubEnv('ADMIN_RESET_SECRET', 'test-reset-secret');
    vi.resetModules();

    const { validateEnv } = await import('../env');

    expect(validateEnv().DATABASE_URL).toMatch(/^postgresql:\/\//);
  });

  it('rejects a non-PostgreSQL database URL with a clear configuration error', async () => {
    vi.stubEnv('DATABASE_URL', 'file:./dev.db');
    vi.stubEnv('NEXTAUTH_SECRET', 'a-valid-test-secret-at-least-32-chars');
    vi.stubEnv('ADMIN_RESET_SECRET', 'test-reset-secret');
    vi.resetModules();

    const { validateEnv } = await import('../env');

    expect(() => validateEnv()).toThrow(
      'DATABASE_URL: must use the postgresql:// or postgres:// protocol',
    );
  });
});

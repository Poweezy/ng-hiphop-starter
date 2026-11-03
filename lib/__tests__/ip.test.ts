import { afterEach, describe, it, expect, vi } from 'vitest';
import { getClientIp } from '../ip';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('getClientIp', () => {
  it('uses the Vercel-controlled client IP header on Vercel', () => {
    vi.stubEnv('VERCEL', '1');
    const req = {
      headers: {
        get: (name: string) => ({
          'x-real-ip': '9.9.9.9',
          'x-forwarded-for': '8.8.8.8',
          'x-vercel-forwarded-for': '1.2.3.4',
        }[name] ?? null),
      },
    };
    expect(getClientIp(req)).toBe('1.2.3.4');
  });

  it('returns unknown instead of trusting unconfigured proxy headers', () => {
    const req = { headers: { get: (name: string) => name === 'x-forwarded-for' ? '1.2.3.4, 5.6.7.8' : null } };
    expect(getClientIp(req)).toBe('unknown');
  });

  it('does not trust x-real-ip outside Vercel', () => {
    const req = { headers: { get: (name: string) => name === 'x-real-ip' ? '1.2.3.4' : null } };
    expect(getClientIp(req)).toBe('unknown');
  });

  it('returns rightmost non-trusted hop when trusted proxies configured', () => {
    vi.stubEnv('TRUSTED_PROXIES', '10.0.0.0/8');
    const req = { headers: { get: (name: string) => name === 'x-forwarded-for' ? '1.2.3.4, 10.1.2.3' : null } };
    expect(getClientIp(req)).toBe('1.2.3.4');
  });

  it('returns unknown when no headers', () => {
    const req = { headers: { get: () => null } };
    expect(getClientIp(req)).toBe('unknown');
  });
});

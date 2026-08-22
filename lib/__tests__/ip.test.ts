import { describe, it, expect } from 'vitest';
import { getClientIp } from '../ip';

describe('getClientIp', () => {
  it('returns x-real-ip when present', () => {
    const req = { headers: { get: (name: string) => name === 'x-real-ip' ? '1.2.3.4' : null } };
    expect(getClientIp(req)).toBe('1.2.3.4');
  });

  it('returns first x-forwarded-for when no trusted proxies', () => {
    const req = { headers: { get: (name: string) => name === 'x-forwarded-for' ? '1.2.3.4, 5.6.7.8' : null } };
    expect(getClientIp(req)).toBe('1.2.3.4');
  });

  it('returns rightmost non-trusted hop when trusted proxies configured', () => {
    process.env.TRUSTED_PROXIES = '10.0.0.0/8';
    const req = { headers: { get: (name: string) => name === 'x-forwarded-for' ? '1.2.3.4, 10.1.2.3' : null } };
    expect(getClientIp(req)).toBe('1.2.3.4');
    delete process.env.TRUSTED_PROXIES;
  });

  it('returns unknown when no headers', () => {
    const req = { headers: { get: () => null } };
    expect(getClientIp(req)).toBe('unknown');
  });
});

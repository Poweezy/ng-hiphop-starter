import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateUnsubscribeToken, verifyUnsubscribeToken } from '@/lib/email/unsubscribe';

const SECRET_ENV = 'EMAIL_UNSUBSCRIBE_SECRET';
const originalSecret = process.env[SECRET_ENV];

beforeEach(() => {
  process.env[SECRET_ENV] = 'test-secret-for-unsubscribe-tokens';
});

afterEach(() => {
  if (originalSecret === undefined) {
    delete process.env[SECRET_ENV];
  } else {
    process.env[SECRET_ENV] = originalSecret;
  }
});

describe('unsubscribe tokens', () => {
  it('round-trips a subscriber id through generate + verify', () => {
    const token = generateUnsubscribeToken('sub_123');
    expect(verifyUnsubscribeToken(token)).toBe('sub_123');
  });

  it('produces distinct tokens for distinct subscribers', () => {
    const a = generateUnsubscribeToken('sub_a');
    const b = generateUnsubscribeToken('sub_b');
    expect(a).not.toBe(b);
    expect(verifyUnsubscribeToken(a)).toBe('sub_a');
    expect(verifyUnsubscribeToken(b)).toBe('sub_b');
  });

  it('rejects a tampered signature', () => {
    const token = generateUnsubscribeToken('sub_123');
    const tampered = `${token.slice(0, -2)}ff`;
    expect(verifyUnsubscribeToken(tampered)).toBeNull();
  });

  it('rejects a token signed with a different secret', () => {
    const token = generateUnsubscribeToken('sub_123');
    process.env[SECRET_ENV] = 'a-completely-different-secret';
    expect(verifyUnsubscribeToken(token)).toBeNull();
  });

  it('rejects an expired token', () => {
    // Negative TTL guarantees the expiry instant is in the past.
    const token = generateUnsubscribeToken('sub_123', -1);
    expect(verifyUnsubscribeToken(token)).toBeNull();
  });

  it('rejects forged payloads built from another token signature', () => {
    const legit = generateUnsubscribeToken('sub_victim');
    const other = generateUnsubscribeToken('sub_other');
    const legitPayload = legit.split('.')[0];
    const otherSignature = other.split('.')[1];
    expect(verifyUnsubscribeToken(`${legitPayload}.${otherSignature}`)).toBeNull();
  });

  it('rejects malformed tokens without throwing', () => {
    expect(verifyUnsubscribeToken('')).toBeNull();
    expect(verifyUnsubscribeToken('no-signature-section')).toBeNull();
    expect(verifyUnsubscribeToken('a.b.c')).toBeNull();
    // Valid base64url but garbage payload / bad expiry.
    expect(verifyUnsubscribeToken('Z2FyYmFnZQ.abcdef')).toBeNull();
  });

  it('fails closed when no secret is configured', () => {
    // Pin every secret that getSecret() would fall back to, so this test stays
    // hermetic even on machines or CI runs where NEXTAUTH_SECRET or
    // ADMIN_RESET_SECRET happen to be set in the ambient environment.
    const fallbackKeys = ['NEXTAUTH_SECRET', 'ADMIN_RESET_SECRET'];
    const savedFallbacks = fallbackKeys.map((k) => process.env[k]);
    fallbackKeys.forEach((k) => delete process.env[k]);
    try {
      delete process.env[SECRET_ENV];
      expect(() => generateUnsubscribeToken('sub_123')).toThrow();
      expect(verifyUnsubscribeToken('anything')).toBeNull();
    } finally {
      fallbackKeys.forEach((k, i) => {
        if (savedFallbacks[i] === undefined) delete process.env[k];
        else process.env[k] = savedFallbacks[i] as string;
      });
    }
  });
});

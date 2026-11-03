import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  generateSubscriberConsentToken,
  verifySubscriberConsentToken,
} from '@/lib/email/subscriber-consent-token';

const SECRET_ENV = 'NEXTAUTH_SECRET';
const originalSecret = process.env[SECRET_ENV];

beforeEach(() => {
  process.env[SECRET_ENV] = 'test-secret-for-subscriber-consent';
});

afterEach(() => {
  if (originalSecret === undefined) {
    delete process.env[SECRET_ENV];
  } else {
    process.env[SECRET_ENV] = originalSecret;
  }
});

describe('subscriber consent tokens', () => {
  it('round-trips the subscriber id and consent timestamp', () => {
    const timestamp = new Date('2026-10-01T12:00:00.000Z');
    const token = generateSubscriberConsentToken('subscriber-1', timestamp);

    expect(verifySubscriberConsentToken(token)).toEqual({
      subscriberId: 'subscriber-1',
      consentTimestamp: timestamp.getTime(),
    });
  });

  it('rejects tampered, malformed, and expired tokens', () => {
    const token = generateSubscriberConsentToken('subscriber-1', new Date(), 1);
    const parts = token.split('.');

    expect(verifySubscriberConsentToken(`${parts[0]}.00${parts[1]}`)).toBeNull();
    expect(verifySubscriberConsentToken('not-a-token')).toBeNull();
    expect(verifySubscriberConsentToken(token, Date.now() + 2)).toBeNull();
  });

  it('fails closed without a signing secret', () => {
    delete process.env[SECRET_ENV];

    expect(() => generateSubscriberConsentToken('subscriber-1', new Date())).toThrow();
    expect(verifySubscriberConsentToken('anything')).toBeNull();
  });
});

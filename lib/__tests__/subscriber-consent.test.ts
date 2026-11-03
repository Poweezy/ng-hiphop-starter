import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { prismaMock, sendMock } = vi.hoisted(() => ({
  prismaMock: {
    subscriber: {
      findUnique: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
  },
  sendMock: vi.fn(),
}));

vi.mock('@/app/db', () => ({ prisma: prismaMock }));
vi.mock('@/lib/email', () => ({
  ConsoleProvider: class ConsoleProvider {},
  getEmailProvider: () => ({ send: sendMock }),
}));

import { requestSubscriberConsent, confirmSubscriberConsent } from '@/lib/subscriber-consent';
import { generateSubscriberConsentToken } from '@/lib/email/subscriber-consent-token';
import { subscriberSchema } from '@/lib/validations';

const SECRET_ENV = 'NEXTAUTH_SECRET';
const originalSecret = process.env[SECRET_ENV];
const originalAppUrl = process.env.APP_URL;

beforeEach(() => {
  vi.clearAllMocks();
  process.env[SECRET_ENV] = 'test-secret-for-subscriber-consent';
  process.env.APP_URL = 'https://ng.example';
  prismaMock.subscriber.findUnique.mockResolvedValue(null);
  prismaMock.subscriber.create.mockResolvedValue({ id: 'subscriber-1' });
  prismaMock.subscriber.updateMany.mockResolvedValue({ count: 1 });
  sendMock.mockResolvedValue({ success: true });
});

afterEach(() => {
  if (originalSecret === undefined) delete process.env[SECRET_ENV];
  else process.env[SECRET_ENV] = originalSecret;
  if (originalAppUrl === undefined) delete process.env.APP_URL;
  else process.env.APP_URL = originalAppUrl;
});

describe('subscriber consent', () => {
  it('does not accept client-supplied trusted subscription states', () => {
    const result = subscriberSchema.safeParse({
      competitionId: 'c123456789012345678901234',
      email: 'person@example.com',
      consentGiven: true,
      consentStatus: 'verified',
      subscriptionStatus: 'active',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('consentStatus');
      expect(result.data).not.toHaveProperty('subscriptionStatus');
    }
  });

  it('creates a pending record and emails a confirmation link', async () => {
    const result = await requestSubscriberConsent({
      competitionId: 'c123456789012345678901234',
      email: 'person@example.com',
      name: 'Listener',
      source: 'Best Lyrics Portal',
    });

    expect(result).toEqual({ created: true });
    expect(prismaMock.subscriber.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        competitionId: 'c123456789012345678901234',
        email: 'person@example.com',
        consentStatus: 'pending',
        subscriptionStatus: 'pending',
      }),
    });
    expect(sendMock).toHaveBeenCalledOnce();
    const sentText = String(sendMock.mock.calls[0]?.[0]?.text);
    const verificationLink = sentText.match(/https:\/\/\S+/)?.[0];
    expect(verificationLink).toBeDefined();
    const verificationUrl = new URL(verificationLink ?? '');
    expect(verificationUrl.origin).toBe('https://ng.example');
    expect(verificationUrl.pathname).toBe('/api/subscribers/verify');
  });

  it('does not resend confirmation to an already verified subscriber', async () => {
    prismaMock.subscriber.findUnique.mockResolvedValue({
      id: 'subscriber-1',
      subscriptionStatus: 'active',
      consentStatus: 'verified',
    });

    await expect(requestSubscriberConsent({
      competitionId: 'c123456789012345678901234',
      email: 'person@example.com',
      source: 'Best Lyrics Portal',
    })).resolves.toEqual({ created: false });

    expect(sendMock).not.toHaveBeenCalled();
    expect(prismaMock.subscriber.create).not.toHaveBeenCalled();
  });

  it('activates only a pending record matching the signed consent timestamp', async () => {
    const consentTimestamp = new Date('2026-10-01T12:00:00.000Z');
    const token = generateSubscriberConsentToken('subscriber-1', consentTimestamp);

    await expect(confirmSubscriberConsent(token)).resolves.toBe(true);
    expect(prismaMock.subscriber.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'subscriber-1',
        consentStatus: 'pending',
        subscriptionStatus: 'pending',
        consentTimestamp,
      },
      data: expect.objectContaining({
        consentStatus: 'verified',
        subscriptionStatus: 'active',
      }),
    });
  });

  it('does not activate a stale or already-used confirmation token', async () => {
    prismaMock.subscriber.updateMany.mockResolvedValue({ count: 0 });
    const token = generateSubscriberConsentToken('subscriber-1', new Date());

    await expect(confirmSubscriberConsent(token)).resolves.toBe(false);
  });
});

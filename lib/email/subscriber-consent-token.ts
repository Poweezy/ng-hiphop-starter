import crypto from 'node:crypto';

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export interface SubscriberConsentToken {
  subscriberId: string;
  consentTimestamp: number;
}

function getSecret(): string | undefined {
  return process.env.EMAIL_UNSUBSCRIBE_SECRET || process.env.NEXTAUTH_SECRET || undefined;
}

function sign(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

export function generateSubscriberConsentToken(
  subscriberId: string,
  consentTimestamp: Date,
  now = Date.now(),
): string {
  const secret = getSecret();
  if (!secret) {
    throw new Error('No secret configured for subscriber consent tokens');
  }
  if (!subscriberId || !Number.isFinite(consentTimestamp.getTime())) {
    throw new Error('Invalid subscriber consent token payload');
  }

  const expiresAt = now + TOKEN_TTL_MS;
  const payload = `${subscriberId}.${consentTimestamp.getTime()}.${expiresAt}`;
  return `${Buffer.from(payload, 'utf8').toString('base64url')}.${sign(payload, secret)}`;
}

export function verifySubscriberConsentToken(
  token: string,
  now = Date.now(),
): SubscriberConsentToken | null {
  const secret = getSecret();
  if (!secret || !token) return null;

  const parts = token.split('.');
  if (parts.length !== 2 || !/^[a-f0-9]{64}$/i.test(parts[1] ?? '')) return null;

  const payload = Buffer.from(parts[0] ?? '', 'base64url').toString('utf8');
  const [subscriberId, consentTimestampValue, expiresAtValue, ...extra] = payload.split('.');
  const consentTimestamp = Number(consentTimestampValue);
  const expiresAt = Number(expiresAtValue);
  if (
    !subscriberId ||
    extra.length > 0 ||
    !Number.isSafeInteger(consentTimestamp) ||
    !Number.isSafeInteger(expiresAt) ||
    now > expiresAt
  ) {
    return null;
  }

  const expected = Buffer.from(sign(payload, secret), 'hex');
  const provided = Buffer.from(parts[1] ?? '', 'hex');
  if (expected.length !== provided.length || !crypto.timingSafeEqual(expected, provided)) {
    return null;
  }

  return { subscriberId, consentTimestamp };
}

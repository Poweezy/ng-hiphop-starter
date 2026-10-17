/**
 * HMAC-signed, expiring tokens for one-click email unsubscribe links.
 *
 * Why signed tokens instead of a bare subscriber ID:
 * - The link cannot be forged (an attacker can't unsubscribe arbitrary users).
 * - Email scanners that prefetch links cannot enumerate or act on other
 *   subscribers — the token only works for the one subscriber it was minted
 *   for and expires after a configurable TTL.
 *
 * Tokens are verified with a constant-time comparison. Verification fails
 * closed when no secret is configured.
 */

import crypto from 'node:crypto';

const DEFAULT_TOKEN_TTL_DAYS = 365;

function getSecret(): string | undefined {
  return (
    process.env.EMAIL_UNSUBSCRIBE_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.ADMIN_RESET_SECRET ||
    undefined
  );
}

function sign(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Builds `subscriberId.expiry` (base64url) plus an HMAC-SHA256 signature.
 * The secret is read per call rather than cached so it stays testable and
 * can be rotated without a process restart.
 */
export function generateUnsubscribeToken(subscriberId: string, ttlDays: number = DEFAULT_TOKEN_TTL_DAYS): string {
  const secret = getSecret();
  if (!secret) {
    throw new Error(
      'No secret configured for unsubscribe tokens — set EMAIL_UNSUBSCRIBE_SECRET (or NEXTAUTH_SECRET)',
    );
  }
  if (!subscriberId) {
    throw new Error('generateUnsubscribeToken requires a subscriberId');
  }
  const expiresAt = Date.now() + ttlDays * 24 * 60 * 60 * 1000;
  const payload = `${subscriberId}.${expiresAt}`;
  // base64url alphabet never contains '.', so the token splits cleanly.
  return `${Buffer.from(payload, 'utf8').toString('base64url')}.${sign(payload, secret)}`;
}

/**
 * Verifies a token and returns the subscriberId it was minted for, or null
 * when the token is malformed, forged, expired, or no secret is configured.
 */
export function verifyUnsubscribeToken(token: string): string | null {
  const secret = getSecret();
  if (!secret || !token) return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  let payload: string;
  try {
    payload = Buffer.from(parts[0], 'base64url').toString('utf8');
  } catch {
    return null;
  }

  const separatorIndex = payload.lastIndexOf('.');
  if (separatorIndex <= 0) return null;

  const subscriberId = payload.slice(0, separatorIndex);
  const expiresAt = Number(payload.slice(separatorIndex + 1));
  if (!subscriberId || !Number.isFinite(expiresAt)) return null;
  if (Date.now() > expiresAt) return null;

  const expected = Buffer.from(sign(payload, secret), 'hex');
  const provided = Buffer.from(parts[1], 'hex');
  if (expected.length !== provided.length) return null;
  if (!crypto.timingSafeEqual(expected, provided)) return null;

  return subscriberId;
}

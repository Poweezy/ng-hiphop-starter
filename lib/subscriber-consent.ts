import { prisma } from '@/app/db';
import { getEmailProvider } from '@/lib/email';
import {
  generateSubscriberConsentToken,
  verifySubscriberConsentToken,
} from '@/lib/email/subscriber-consent-token';

interface SubscriberConsentRequest {
  competitionId: string;
  email: string;
  name?: string | null;
  source: string;
}

export async function requestSubscriberConsent(input: SubscriberConsentRequest): Promise<{ created: boolean }> {
  const where = {
    competitionId_email: {
      competitionId: input.competitionId,
      email: input.email,
    },
  };
  const existing = await prisma.subscriber.findUnique({ where });

  if (existing?.subscriptionStatus === 'active' && existing.consentStatus === 'verified') {
    return { created: false };
  }

  const consentTimestamp = new Date();
  let subscriberId: string;
  let created = false;

  if (existing) {
    const updated = await prisma.subscriber.updateMany({
      where: {
        id: existing.id,
        consentStatus: existing.consentStatus,
        subscriptionStatus: existing.subscriptionStatus,
        consentTimestamp: existing.consentTimestamp,
      },
      data: {
        name: input.name,
        source: input.source,
        consentStatus: 'pending',
        subscriptionStatus: 'pending',
        consentTimestamp,
        unsubscribedAt: null,
      },
    });

    if (updated.count !== 1) {
      const current = await prisma.subscriber.findUnique({ where: { id: existing.id } });
      if (current?.subscriptionStatus === 'active' && current.consentStatus === 'verified') {
        return { created: false };
      }
      throw new Error('Subscriber consent state changed while processing a request');
    }

    subscriberId = existing.id;
  } else {
    const subscriber = await prisma.subscriber.create({
      data: {
        competitionId: input.competitionId,
        email: input.email,
        name: input.name,
        source: input.source,
        consentStatus: 'pending',
        subscriptionStatus: 'pending',
        consentTimestamp,
      },
    });
    subscriberId = subscriber.id;
    created = true;
  }

  const provider = getEmailProvider();

  const configuredUrl = process.env.APP_URL || process.env.NEXTAUTH_URL;
  if (!configuredUrl && process.env.NODE_ENV === 'production') {
    throw new Error('APP_URL or NEXTAUTH_URL is required for subscriber verification');
  }
  const appUrl = new URL(configuredUrl || 'http://localhost:3000');
  if (process.env.NODE_ENV === 'production' && appUrl.protocol !== 'https:') {
    throw new Error('Subscriber verification requires an HTTPS APP_URL in production');
  }

  const token = generateSubscriberConsentToken(subscriberId, consentTimestamp);
  const verificationUrl = new URL('/api/subscribers/verify', appUrl);
  verificationUrl.searchParams.set('token', token);
  const result = await provider.send({
    to: input.email,
    subject: 'Confirm your Nerd Gauge subscription',
    text: `Confirm your email subscription by opening this link: ${verificationUrl.toString()}\n\nIf you did not request this, you can ignore this email.`,
    html: `<p>Confirm your email subscription to Nerd Gauge updates.</p><p><a href="${verificationUrl.toString()}">Review and confirm subscription</a></p><p>If you did not request this, you can ignore this email.</p>`,
  });

  if (!result.success) {
    throw new Error('Subscriber verification email could not be sent');
  }

  return { created };
}

export async function confirmSubscriberConsent(token: string): Promise<boolean> {
  const claims = verifySubscriberConsentToken(token);
  if (!claims) return false;

  const result = await prisma.subscriber.updateMany({
    where: {
      id: claims.subscriberId,
      consentStatus: 'pending',
      subscriptionStatus: 'pending',
      consentTimestamp: new Date(claims.consentTimestamp),
    },
    data: {
      consentStatus: 'verified',
      subscriptionStatus: 'active',
      consentTimestamp: new Date(),
      unsubscribedAt: null,
    },
  });

  return result.count === 1;
}

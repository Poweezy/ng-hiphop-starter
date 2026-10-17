import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/db';
import { verifyUnsubscribeToken } from '@/lib/email/unsubscribe';
import { getRequestId } from '@/lib/api';
import { recordRequest } from '@/lib/observability';

/**
 * One-click unsubscribe (CAN-SPAM / GDPR).
 *
 * The subscriberId is carried inside an HMAC-signed, expiring token (see
 * lib/email/unsubscribe.ts) so the link can neither be forged nor used to
 * unsubscribe someone else. Responses are idempotent and never reveal
 * whether an address exists.
 */
export async function GET(req: NextRequest) {
  const requestId = getRequestId(req);
  const start = performance.now();

  const page = (heading: string, message: string) =>
    new NextResponse(
      `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>${heading} — Nerd Gauge</title>
    <style>
      body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
             background: #0a0a0a; color: #f4f4f5; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; }
      .card { max-width: 420px; margin: 24px; padding: 40px 32px; text-align: center;
              background: #141414; border: 1px solid #27272a; border-radius: 12px; }
      h1 { font-size: 22px; margin: 0 0 12px; }
      p { font-size: 14px; line-height: 1.6; color: #a1a1aa; margin: 0; }
      .brand { display: block; margin-bottom: 24px; font-weight: 800; letter-spacing: 2px;
               text-transform: uppercase; color: #facc15; font-size: 13px; }
    </style>
  </head>
  <body>
    <main class="card">
      <span class="brand">Nerd Gauge</span>
      <h1>${heading}</h1>
      <p>${message}</p>
    </main>
  </body>
</html>`,
      {
        status: 200,
        headers: {
          'content-type': 'text/html; charset=utf-8',
          // Never cache a token-bearing URL (shared proxies, scanner prefetch).
          'cache-control': 'no-store',
          'x-robots-tag': 'noindex',
        },
      },
    );

  try {
    const token = new URL(req.url).searchParams.get('token');

    if (!token) {
      recordRequest('GET', '/api/unsubscribe', 400, performance.now() - start, requestId);
      return page('Invalid link', 'This unsubscribe link is missing its security token. Please use the link from your email.');
    }

    const subscriberId = verifyUnsubscribeToken(token);
    if (!subscriberId) {
      recordRequest('GET', '/api/unsubscribe', 400, performance.now() - start, requestId);
      return page('Link expired', 'This unsubscribe link is invalid or has expired. If you keep receiving emails, contact us and we will remove you manually.');
    }

    const subscriber = await prisma.subscriber.findUnique({ where: { id: subscriberId } });

    if (subscriber && subscriber.subscriptionStatus !== 'unsubscribed') {
      await prisma.subscriber.update({
        where: { id: subscriberId },
        data: {
          subscriptionStatus: 'unsubscribed',
          unsubscribedAt: new Date(),
          consentStatus: 'withdrawn',
          consentTimestamp: new Date(),
        },
      });
    }

    recordRequest('GET', '/api/unsubscribe', 200, performance.now() - start, requestId);
    return page(
      "You're unsubscribed",
      subscriber
        ? 'You will no longer receive marketing emails from Nerd Gauge. This applies immediately, even to campaigns that are currently being sent.'
        : 'This email address is not on our list, or it has already been removed. Nothing further is needed from you.',
    );
  } catch (error) {
    console.error('Unsubscribe error:', error);
    recordRequest('GET', '/api/unsubscribe', 500, performance.now() - start, requestId);
    return page('Something went wrong', 'We could not process your unsubscribe request right now. Please try again in a moment.');
  }
}

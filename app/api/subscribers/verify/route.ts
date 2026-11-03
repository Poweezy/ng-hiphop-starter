import { NextRequest, NextResponse } from 'next/server';
import { confirmSubscriberConsent } from '@/lib/subscriber-consent';
import { getRequestId } from '@/lib/api';
import { recordRequest } from '@/lib/observability';

function confirmationPage(confirmed: boolean): NextResponse {
  const heading = confirmed ? 'Subscription confirmed' : 'Link unavailable';
  const message = confirmed
    ? 'Your email subscription is confirmed. You can close this page.'
    : 'This confirmation link is invalid, expired, or has already been used.';

  return new NextResponse(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="referrer" content="no-referrer" />
    <meta name="robots" content="noindex" />
    <title>${heading} — Nerd Gauge</title>
  </head>
  <body>
    <main>
      <h1>${heading}</h1>
      <p>${message}</p>
    </main>
  </body>
</html>`,
    {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
        'referrer-policy': 'no-referrer',
        'x-robots-tag': 'noindex',
      },
    },
  );
}

function confirmationPrompt(token: string): NextResponse {
  const safeToken = token.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  return new NextResponse(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="referrer" content="no-referrer" />
    <meta name="robots" content="noindex" />
    <title>Confirm subscription — Nerd Gauge</title>
  </head>
  <body>
    <main>
      <h1>Confirm your subscription</h1>
      <p>Select the button below to confirm that you want to receive Nerd Gauge updates.</p>
      <form method="post">
        <input type="hidden" name="token" value="${safeToken}" />
        <button type="submit">Confirm subscription</button>
      </form>
    </main>
  </body>
</html>`,
    {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
        'referrer-policy': 'no-referrer',
        'x-robots-tag': 'noindex',
      },
    },
  );
}

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token') || '';
  if (!token || token.length > 2048) return confirmationPage(false);
  return confirmationPrompt(token);
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req);
  const start = performance.now();
  try {
    const formData = await req.formData();
    const token = formData.get('token');
    const confirmed = typeof token === 'string' && token.length <= 2048
      ? await confirmSubscriberConsent(token)
      : false;

    recordRequest('POST', '/api/subscribers/verify', confirmed ? 200 : 400, performance.now() - start, requestId);
    return confirmationPage(confirmed);
  } catch (error) {
    console.error('Subscriber confirmation error:', error);
    recordRequest('POST', '/api/subscribers/verify', 500, performance.now() - start, requestId);
    return confirmationPage(false);
  }
}

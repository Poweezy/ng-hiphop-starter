import { NextRequest, NextResponse } from 'next/server';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Hosts legitimately referenced by user-managed media and known embeds.
// Mirrors images.remotePatterns in next.config.js plus Supabase Storage.
// Replaces the previous wildcard `img-src https:` / `connect-src https:`.
// NOTE: CSP host sources may only use a wildcard as the LEFTMOST label.
// `https://*.s3.*.amazonaws.com` (wildcard mid-host) is invalid and browsers
// ignore it, so regional S3 endpoints are covered by the broader-but-valid
// `https://*.amazonaws.com` below.
const MEDIA_HOSTS = [
  'https://open.spotify.com',
  'https://music.apple.com',
  'https://actions.google.com',
  'https://images.unsplash.com',
  'https://picsum.photos',
  'https://s3.amazonaws.com',
  'https://*.s3.amazonaws.com',
  'https://*.amazonaws.com', // covers *.s3.<region>.amazonaws.com (CSP forbids mid-host wildcards)
  'https://*.supabase.co',
].join(' ');

const CONNECT_HOSTS = [
  'https://*.sentry.io',            // Sentry client error reporting
  'https://va.vercel-scripts.com',  // Vercel Analytics fallback CDN
  'https://*.supabase.co',          // Supabase Storage client access
].join(' ');

function buildCsp({ nonce, isProd }: { nonce?: string; isProd: boolean }): string {
  // Admin pages are dynamically rendered, so they get a strict per-request
  // nonce + strict-dynamic (the trailing 'self'/'unsafe-inline' are fallbacks
  // honored only by pre-CSP3 browsers). All other routes include statically
  // generated ISR pages where a per-request nonce is impossible — they keep
  // 'unsafe-inline', which is required for Next.js + styled-jsx there.
  // Dev additionally needs 'unsafe-eval' for React refresh/HMR tooling.
  const scriptSrc = nonce
    ? `'nonce-${nonce}' 'strict-dynamic' 'self' 'unsafe-inline'`
    : `'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"}`;

  return [
    "default-src 'self'",
    `script-src ${scriptSrc} https://va.vercel-scripts.com`, // Vercel Analytics debug script (dev)
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    `img-src 'self' data: blob: ${MEDIA_HOSTS}`,
    `media-src 'self' blob: ${MEDIA_HOSTS}`,
    `connect-src 'self' ${CONNECT_HOSTS}`,
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    ...(isProd ? ['upgrade-insecure-requests'] : []),
  ].join('; ');
}

// Pure CSP construction logic, exported for unit testing.
export { buildCsp };

function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

// Next.js 16 renamed the "middleware" convention to "proxy". This module runs
// on every matched request (see `config.matcher` below) and provides:
//   1. Per-request Content-Security-Policy (strict nonce for /admin in prod)
//   2. Defense-in-depth CSRF origin checks for mutating methods
//   3. X-Request-Id correlation headers
// Pure decision logic for the mutating-request origin check, exported so the
// security behavior is unit-testable without the Next.js runtime.
// Returns null when allowed, or a 403 reason string.
export function validateMutationOrigin(
  origin: string | null,
  host: string | null,
  isProd: boolean,
): string | null {
  if (origin) {
    let originHost: string;
    try {
      originHost = new URL(origin).host;
    } catch {
      return 'Invalid Origin';
    }
    if (originHost !== host) {
      return 'Cross-origin request rejected';
    }
    return null;
  }
  // Origin absent: some same-origin native calls omit it, allow in dev to
  // avoid breaking local tooling — NextAuth enforces its own CSRF token on
  // auth routes. In production a missing Origin on a mutating request is
  // treated as suspicious.
  return isProd ? 'CSRF validation failed: Origin header missing' : null;
}

export default function proxy(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const isProd = process.env.NODE_ENV === 'production';
  const path = req.nextUrl.pathname;
  const isAdminRoute =
    path === '/admin' || path.startsWith('/admin/');

  // Defense-in-depth CSRF protection + request correlation.
  //
  // For state-changing requests we verify the Origin header matches the Host
  // header (same-origin). Browsers always send Origin for cross-origin and
  // cross-site requests, so a mismatch means the call did not originate from
  // our own UI. GET/HEAD are not state-changing and are allowed. When Origin is
  // absent (some same-origin native calls) we allow, to avoid breaking legit
  // traffic — NextAuth already enforces its own CSRF token on auth routes.
  if (MUTATING_METHODS.has(req.method)) {
    const origin = req.headers.get('origin');
    const host = req.headers.get('host');

    const originError = validateMutationOrigin(origin, host, isProd);
    if (originError) {
      return new NextResponse(originError, { status: 403 });
    }
  }

  const cspHeader = buildCsp({
    // Strict nonce CSP only in production admin routes: dev needs
    // 'unsafe-eval' for React refresh and static pages cannot be nonced.
    nonce: isProd && isAdminRoute ? generateNonce() : undefined,
    isProd,
  });

  if (isAdminRoute) {
    const nonceMatch = /'nonce-([^']+)'/.exec(cspHeader);
    if (nonceMatch) {
      // Setting the CSP on the request headers lets Next automatically add the
      // nonce to its own bootstrap <script> tags for dynamically rendered pages.
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('x-nonce', nonceMatch[1]);
      requestHeaders.set('Content-Security-Policy', cspHeader);
      const res = NextResponse.next({ request: { headers: requestHeaders } });
      res.headers.set('X-Request-Id', requestId);
      res.headers.set('Content-Security-Policy', cspHeader);
      return res;
    }
  }

  const res = NextResponse.next();
  res.headers.set('X-Request-Id', requestId);
  res.headers.set('Content-Security-Policy', cspHeader);
  return res;
}

export const config = {
  // Apply everywhere except static assets and image optimization.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images/|uploads/).*)'],
};

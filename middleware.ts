import { NextRequest, NextResponse } from 'next/server';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Hosts legitimately referenced by user-managed media and known embeds.
// Mirrors images.remotePatterns in next.config.js plus Supabase Storage.
// Replaces the previous wildcard `img-src https:` / `connect-src https:`.
const MEDIA_HOSTS = [
  'https://open.spotify.com',
  'https://music.apple.com',
  'https://actions.google.com',
  'https://images.unsplash.com',
  'https://picsum.photos',
  'https://s3.amazonaws.com',
  'https://*.s3.amazonaws.com',
  'https://*.s3.*.amazonaws.com',
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
  const scriptSrc = nonce
    ? `'nonce-${nonce}' 'strict-dynamic' 'self' 'unsafe-inline'`
    : `'self' 'unsafe-inline'`;

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
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

function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

export function middleware(req: NextRequest) {
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

    if (origin) {
      let originHost: string;
      try {
        originHost = new URL(origin).host;
      } catch {
        return new NextResponse('Invalid Origin', { status: 403 });
      }
      if (originHost !== host) {
        return new NextResponse('Cross-origin request rejected', { status: 403 });
      }
    } else if (isProd) {
      return new NextResponse('CSRF validation failed: Origin header missing', { status: 403 });
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

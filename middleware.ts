import { NextRequest, NextResponse } from 'next/server';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Defense-in-depth CSRF protection + request correlation.
//
// For state-changing requests we verify the Origin header matches the Host
// header (same-origin). Browsers always send Origin for cross-origin and
// cross-site requests, so a mismatch means the call did not originate from
// our own UI. GET/HEAD are not state-changing and are allowed. When Origin is
// absent (some same-origin native calls) we allow, to avoid breaking legit
// traffic — NextAuth already enforces its own CSRF token on auth routes.
export function middleware(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const res = NextResponse.next();
  res.headers.set('X-Request-Id', requestId);

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
    } else if (process.env.NODE_ENV === 'production') {
      return new NextResponse('CSRF validation failed: Origin header missing', { status: 403 });
    }
  }

  return res;
}

export const config = {
  // Apply everywhere except static assets and image optimization.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images/|uploads/).*)'],
};

import { NextRequest } from 'next/server';

// Best-effort client IP extraction.
//
// Trust order (most to least trusted):
//   1. x-real-ip        — normally set by YOUR reverse proxy, not the client.
//   2. x-forwarded-for  — first (leftmost) hop is the original client; only
//                         trust it because a trusted proxy appends to it.
//
// NOTE: `req.ip` is not a standard property on NextRequest and is not reliably
// available, so we rely on the proxy-provided headers. Ensure your hosting
// proxy (e.g. Vercel) overwrites these headers to prevent spoofing.
export function getClientIp(req: NextRequest): string {
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();

  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }

  return 'unknown';
}

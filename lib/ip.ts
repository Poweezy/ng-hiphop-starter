import { NextRequest } from 'next/server';

// Best-effort client IP extraction.
//
// Trust order (most to least trusted):
//   1. x-real-ip        — normally set by YOUR reverse proxy, not the client.
//   2. x-forwarded-for  — first (leftmost) hop is the original client; only
//                         trust it because a trusted proxy appends to it.
//   3. req.ip           — platform-provided (e.g. Vercel) connection address.
//
// IMPORTANT: if your proxy is NOT stripping client-supplied x-real-ip /
// x-forwarded-for headers, clients can spoof their IP and evade rate limits.
// Ensure the edge proxy overwrites these headers.
export function getClientIp(req: NextRequest): string {
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();

  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }

  if (req.ip) return req.ip;

  return 'unknown';
}

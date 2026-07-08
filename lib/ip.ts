import { NextRequest } from 'next/server';

// Best-effort IP extraction. In production, ensure your proxy/load balancer sets real IP headers.
export function getClientIp(req: NextRequest): string {
  const real = req.headers.get('x-real-ip');
  if (real) return real;

  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    // x-forwarded-for may contain a list: client, proxy1, proxy2
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }

  return 'unknown';
}


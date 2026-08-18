/**
 * Best-effort client IP extraction with proxy-aware validation.
 *
 * The X-Forwarded-For chain has the form: client, proxy1, proxy2, ...
 * We walk the chain from the right; any IP that is NOT a trusted proxy
 * is the origin client. This prevents spoofing of the leftmost entry.
 *
 * TRUSTED_PROXIES: comma-separated list of CIDR ranges or IPs for your
 * known reverse proxies (e.g. Vercel/Cloudflare edge). In production,
 * set this env var so client-supplied XFF can't be forged.
 */

function parseTrustedProxies(): string[] {
  const raw = process.env.TRUSTED_PROXIES || '';
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

function ipToInt(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  const nums = parts.map((p) => parseInt(p, 10));
  if (nums.some((n) => isNaN(n) || n < 0 || n > 255)) return null;
  return (nums[0]! << 24) >>> 0 | (nums[1]! << 16) | (nums[2]! << 8) | nums[3]!;
}

function cidrToRange(cidr: string): { start: number; end: number } | null {
  const [ip, prefix] = cidr.split('/');
  const base = ipToInt(ip ?? '');
  if (base === null) return null;
  const bits = parseInt(prefix ?? '32', 10);
  if (isNaN(bits) || bits < 0 || bits > 32) return null;
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  const start = base & mask;
  const end = start | ~mask;
  return { start, end };
}

function isIpInCidr(ip: string, cidr: string): boolean {
  const range = cidrToRange(cidr);
  if (!range) return ip === cidr;
  const num = ipToInt(ip);
  if (num === null) return false;
  return num >= range.start && num <= range.end;
}

export function getClientIp(req: { headers: { get(name: string): string | null } }): string {
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();

  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const hops = xff.split(',').map((h) => h.trim());
    const trusted = parseTrustedProxies();

    if (trusted.length === 0) {
      const first = hops[0];
      if (first) return first;
    } else {
      for (let i = hops.length - 1; i >= 0; i--) {
        const hop = hops[i];
        if (!hop || hop === 'unknown') continue;
        const isTrusted = trusted.some((t) =>
          t.includes('/') ? isIpInCidr(hop, t) : hop === t,
        );
        if (!isTrusted) return hop;
      }
      return hops[hops.length - 1] ?? 'unknown';
    }
  }

  return 'unknown';
}

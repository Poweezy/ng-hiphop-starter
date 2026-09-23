import { describe, it, expect } from 'vitest';
import { buildCsp, validateMutationOrigin } from '@/proxy';

describe('buildCsp', () => {
  it('uses only leftmost wildcards in host sources (no mid-host *)', () => {
    const csp = buildCsp({ isProd: true });
    // Any host source with a wildcard must start with "*."
    const sources = csp.split(/[\s;]+/).filter((s) => s.includes('*'));
    for (const s of sources) {
      const hostPart = s.replace(/^https?:\/\//, '');
      expect(hostPart.startsWith('*.') || !hostPart.includes('*')).toBe(true);
    }
    // Regression: the invalid mid-host wildcard must never reappear
    expect(csp).not.toContain('s3.*.amazonaws.com');
  });

  it('dev policy includes unsafe-eval, prod does not', () => {
    expect(buildCsp({ isProd: false })).toContain("'unsafe-eval'");
    expect(buildCsp({ isProd: true })).not.toContain("'unsafe-eval'");
  });

  it('prod policy sets upgrade-insecure-requests, dev does not', () => {
    expect(buildCsp({ isProd: true })).toContain('upgrade-insecure-requests');
    expect(buildCsp({ isProd: false })).not.toContain('upgrade-insecure-requests');
  });

  it('admin nonce policy enables strict-dynamic with the nonce', () => {
    const csp = buildCsp({ nonce: 'abc123', isProd: true });
    expect(csp).toContain("'nonce-abc123'");
    expect(csp).toContain("'strict-dynamic'");
  });

  it('locks down frame-ancestors and object-src', () => {
    const csp = buildCsp({ isProd: true });
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
  });

  it('allows the Vercel Analytics script host', () => {
    expect(buildCsp({ isProd: true })).toContain('https://va.vercel-scripts.com');
  });
});

describe('validateMutationOrigin', () => {
  it('allows same-origin POST', () => {
    expect(
      validateMutationOrigin('http://localhost:3000', 'localhost:3000', false),
    ).toBeNull();
  });

  it('rejects cross-origin POST', () => {
    expect(
      validateMutationOrigin('https://evil.example', 'localhost:3000', false),
    ).toBe('Cross-origin request rejected');
  });

  it('rejects malformed Origin', () => {
    expect(
      validateMutationOrigin('not-a-url', 'localhost:3000', false),
    ).toBe('Invalid Origin');
  });

  it('missing Origin allowed in dev, rejected in prod', () => {
    expect(validateMutationOrigin(null, 'localhost:3000', false)).toBeNull();
    expect(
      validateMutationOrigin(null, 'localhost:3000', true),
    ).toBe('CSRF validation failed: Origin header missing');
  });

  it('compares host including port (scheme-independent)', () => {
    // https origin vs http host: same host:port => allowed
    expect(
      validateMutationOrigin('https://localhost:3000', 'localhost:3000', true),
    ).toBeNull();
  });
});
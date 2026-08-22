import { describe, it, expect, beforeEach } from 'vitest';
import { withIdempotency, getCachedIdempotentResponse, extractIdempotencyKey } from '../idempotency';

describe('idempotency', () => {
  beforeEach(() => {
    // Clear the internal store by importing fresh - we can't directly clear the Map
    // but we can test with different keys to avoid collisions
  });

  it('extractIdempotencyKey returns null when header missing', () => {
    const req = { headers: { get: () => null } } as any;
    expect(extractIdempotencyKey(req)).toBeNull();
  });

  it('extractIdempotencyKey returns trimmed key when present', () => {
    const req = { headers: { get: (name: string) => name === 'idempotency-key' ? '  key-123  ' : null } } as any;
    expect(extractIdempotencyKey(req)).toBe('key-123');
  });

  it('extractIdempotencyKey returns null for empty key', () => {
    const req = { headers: { get: (name: string) => name === 'idempotency-key' ? '   ' : null } } as any;
    expect(extractIdempotencyKey(req)).toBeNull();
  });

  it('withIdempotency executes function and caches result', async () => {
    let calls = 0;
    const fn = async () => {
      calls++;
      return { response: { id: '1' }, status: 201 };
    };

    const first = await withIdempotency('test-key-1', fn);
    const second = await withIdempotency('test-key-1', fn);

    expect(calls).toBe(1);
    expect(first).toEqual({ response: { id: '1' }, status: 201 });
    expect(second).toEqual({ response: { id: '1' }, status: 201 });
  });
});

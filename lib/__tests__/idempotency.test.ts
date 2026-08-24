import { describe, it, expect } from 'vitest';
import { withIdempotency, extractIdempotencyKey } from '../idempotency';
import type { NextRequest } from 'next/server';

type FakeRequest = { headers: { get: (name: string) => string | null } };
const asRequest = (fake: FakeRequest) => fake as unknown as NextRequest;

describe('idempotency', () => {
  it('extractIdempotencyKey returns null when header missing', () => {
    const req = asRequest({ headers: { get: () => null } });
    expect(extractIdempotencyKey(req)).toBeNull();
  });

  it('extractIdempotencyKey returns trimmed key when present', () => {
    const req = asRequest({ headers: { get: (name: string) => name === 'idempotency-key' ? '  key-123  ' : null } });
    expect(extractIdempotencyKey(req)).toBe('key-123');
  });

  it('extractIdempotencyKey returns null for empty key', () => {
    const req = asRequest({ headers: { get: (name: string) => name === 'idempotency-key' ? '   ' : null } });
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

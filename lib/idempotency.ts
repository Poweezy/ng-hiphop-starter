import { NextRequest } from 'next/server';

type IdempotencyRecord = {
  response: unknown;
  status: number;
  expiresAt: number;
};

const idempotencyStore = new Map<string, IdempotencyRecord>();

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

export function getCachedIdempotentResponse(key: string): { response: unknown; status: number } | null {
  const record = idempotencyStore.get(key);
  if (!record) return null;
  if (Date.now() > record.expiresAt) {
    idempotencyStore.delete(key);
    return null;
  }
  return { response: record.response, status: record.status };
}

export async function withIdempotency<T>(
  key: string,
  fn: () => Promise<{ response: unknown; status: number }>
): Promise<{ response: unknown; status: number }> {
  const cached = getCachedIdempotentResponse(key);
  if (cached) return cached;

  const result = await fn();
  idempotencyStore.set(key, {
    response: result.response,
    status: result.status,
    expiresAt: Date.now() + DEFAULT_TTL_MS,
  });
  return result;
}

export function extractIdempotencyKey(req: NextRequest): string | null {
  const key = req.headers.get('idempotency-key');
  if (!key) return null;
  return key.trim();
}

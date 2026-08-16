import { NextRequest } from 'next/server';

type IdempotencyRecord = {
  response: unknown;
  status: number;
  expiresAt: number;
}

const idempotencyStore = new Map<string, IdempotencyRecord>();

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

// Upper bound on in-memory entries to prevent OOM under heavy traffic.
// When the cap is reached the least-recently-used entry is evicted.
const MAX_ENTRIES = 5000;

// NOTE: This store is process-local and NOT shared across serverless instances.
// On platforms like Vercel, a client retry on a different instance will not
// find the cached response and may create a duplicate record. For production
// durability, replace this with a Redis- or database-backed idempotency store.

// Idempotency-Key HTTP header must be a non-empty string of at most 128 chars
// (RFC 7230 allows arbitrarily long header values, but we cap to prevent abuse).
const MAX_KEY_LENGTH = 128;

function validateKey(key: string): string {
  const trimmed = key.trim();
  if (trimmed.length === 0) {
    throw new Error('Idempotency-Key must not be empty');
  }
  if (trimmed.length > MAX_KEY_LENGTH) {
    throw new Error(`Idempotency-Key exceeds ${MAX_KEY_LENGTH} characters`);
  }
  return trimmed;
}

function enforceMaxEntries() {
  while (idempotencyStore.size > MAX_ENTRIES) {
    // Map iteration order is insertion order — the first key is the LRU entry.
    const oldestKey = idempotencyStore.keys().next().value;
    if (oldestKey !== undefined) {
      idempotencyStore.delete(oldestKey);
    }
  }
}

export function getCachedIdempotentResponse(key: string): { response: unknown; status: number } | null {
  const validatedKey = validateKey(key);
  const record = idempotencyStore.get(validatedKey);
  if (!record) return null;
  if (Date.now() > record.expiresAt) {
    idempotencyStore.delete(validatedKey);
    return null;
  }
  // Touch on read so recently-accessed entries survive eviction.
  // Map doesn't support move-to-end natively; delete+re-insert promotes the key.
  idempotencyStore.delete(validatedKey);
  idempotencyStore.set(validatedKey, record);
  return { response: record.response, status: record.status };
}

export async function withIdempotency<T>(
  key: string,
  fn: () => Promise<{ response: unknown; status: number }>
): Promise<{ response: unknown; status: number }> {
  const validatedKey = validateKey(key);

  const cached = getCachedIdempotentResponse(validatedKey);
  if (cached) return cached;

  const result = await fn();
  idempotencyStore.set(validatedKey, {
    response: result.response,
    status: result.status,
    expiresAt: Date.now() + DEFAULT_TTL_MS,
  });

  // Purge LRU entries if we exceeded the cap after the new insert.
  enforceMaxEntries();

  return result;
}

export function extractIdempotencyKey(req: NextRequest): string | null {
  const raw = req.headers.get('idempotency-key');
  if (!raw) return null;
  try {
    return validateKey(raw);
  } catch {
    return null;
  }
}

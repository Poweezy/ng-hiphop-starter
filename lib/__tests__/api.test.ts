import { describe, it, expect } from 'vitest';
import { successResponse, errorResponse, getRequestId } from '../api';

describe('api helpers', () => {
  it('successResponse returns JSON with success flag', async () => {
    const res = successResponse({ hello: 'world' }, 200);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ success: true, data: { hello: 'world' } });
  });

  it('errorResponse returns JSON with error flag', async () => {
    const res = errorResponse('Something failed', 400, 'BAD_REQUEST', { field: 'x' });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toEqual({ success: false, error: { code: 'BAD_REQUEST', message: 'Something failed', details: { field: 'x' } } });
  });

  it('getRequestId returns existing x-request-id', () => {
    const req = { headers: { get: (name: string) => name === 'x-request-id' ? 'abc-123' : null } } as any;
    expect(getRequestId(req)).toBe('abc-123');
  });

  it('getRequestId generates UUID when missing', () => {
    const req = { headers: { get: () => null } } as any;
    const id = getRequestId(req);
    expect(id).toBeTruthy();
    expect(id.length).toBeGreaterThan(20);
  });
});

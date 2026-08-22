import { describe, it, expect, vi } from 'vitest';
import { scanBuffer } from '../uploadScanner';

describe('scanBuffer', () => {
  it('returns clean:true when scanner disabled and fail-open in dev', async () => {
    const original = process.env.VIRUS_SCANNER_ENABLED;
    const originalFailOpen = process.env.VIRUS_SCANNER_FAIL_OPEN;
    process.env.VIRUS_SCANNER_ENABLED = 'false';
    process.env.VIRUS_SCANNER_FAIL_OPEN = 'true';
    process.env.NODE_ENV = 'test';

    const result = await scanBuffer(Buffer.from('hello'), 'test.txt');

    expect(result.clean).toBe(true);
    process.env.VIRUS_SCANNER_ENABLED = original;
    process.env.VIRUS_SCANNER_FAIL_OPEN = originalFailOpen;
  });

  it('returns clean:false with reason when scanner disabled and fail-closed in prod', async () => {
    const original = process.env.VIRUS_SCANNER_ENABLED;
    const originalFailOpen = process.env.VIRUS_SCANNER_FAIL_OPEN;
    process.env.VIRUS_SCANNER_ENABLED = 'false';
    process.env.VIRUS_SCANNER_FAIL_OPEN = 'false';
    process.env.NODE_ENV = 'production';

    const result = await scanBuffer(Buffer.from('hello'), 'test.txt');

    expect(result.clean).toBe(false);
    expect(result.reason).toBe('Virus scanner is disabled');
    process.env.VIRUS_SCANNER_ENABLED = original;
    process.env.VIRUS_SCANNER_FAIL_OPEN = originalFailOpen;
  });

  it('returns clean:false on unknown scanner', async () => {
    const original = process.env.VIRUS_SCANNER_ENABLED;
    const originalScanner = process.env.VIRUS_SCANNER;
    process.env.VIRUS_SCANNER_ENABLED = 'true';
    process.env.VIRUS_SCANNER = 'nonexistent';

    const result = await scanBuffer(Buffer.from('hello'), 'test.txt');

    expect(result.clean).toBe(false);
    expect(result.reason).toContain('Unknown virus scanner');
    process.env.VIRUS_SCANNER_ENABLED = original;
    process.env.VIRUS_SCANNER = originalScanner;
  });
});

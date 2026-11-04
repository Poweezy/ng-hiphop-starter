import { describe, it, expect, vi } from 'vitest';
import { scanBuffer } from '../uploadScanner';

describe('scanBuffer', () => {
  it('returns clean:true when scanner disabled and fail-open in dev', async () => {
    const original = process.env.VIRUS_SCANNER_ENABLED;
    const originalFailOpen = process.env.VIRUS_SCANNER_FAIL_OPEN;
    process.env.VIRUS_SCANNER_ENABLED = 'false';
    process.env.VIRUS_SCANNER_FAIL_OPEN = 'true';

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
    vi.stubEnv('NODE_ENV', 'production');

    try {
      const result = await scanBuffer(Buffer.from('hello'), 'test.txt');

      expect(result.clean).toBe(false);
      expect(result.reason).toBe('Virus scanner is disabled');
    } finally {
      process.env.VIRUS_SCANNER_ENABLED = original;
      process.env.VIRUS_SCANNER_FAIL_OPEN = originalFailOpen;
      vi.unstubAllEnvs();
    }
  });

  it('accepts unscanned audio in production only when explicitly enabled', async () => {
    const original = {
      enabled: process.env.VIRUS_SCANNER_ENABLED,
      allowUnscannedAudio: process.env.ALLOW_UNSCANNED_AUDIO,
    };
    process.env.VIRUS_SCANNER_ENABLED = 'false';
    process.env.ALLOW_UNSCANNED_AUDIO = 'true';
    vi.stubEnv('NODE_ENV', 'production');

    try {
      const result = await scanBuffer(Buffer.from('audio'), 'track.mp3', { allowUnscanned: true });
      expect(result.clean).toBe(true);

      const imageResult = await scanBuffer(Buffer.from('image'), 'cover.jpg');
      expect(imageResult.clean).toBe(false);
    } finally {
      process.env.VIRUS_SCANNER_ENABLED = original.enabled;
      process.env.ALLOW_UNSCANNED_AUDIO = original.allowUnscannedAudio;
      vi.unstubAllEnvs();
    }
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

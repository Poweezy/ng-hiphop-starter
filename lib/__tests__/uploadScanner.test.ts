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

  it('accepts unscanned audio and covers in production only when individually enabled', async () => {
    const original = {
      enabled: process.env.VIRUS_SCANNER_ENABLED,
      allowUnscannedAudio: process.env.ALLOW_UNSCANNED_AUDIO,
      allowUnscannedCovers: process.env.ALLOW_UNSCANNED_COVERS,
    };
    process.env.VIRUS_SCANNER_ENABLED = 'false';
    process.env.ALLOW_UNSCANNED_AUDIO = 'true';
    process.env.ALLOW_UNSCANNED_COVERS = 'false';
    vi.stubEnv('NODE_ENV', 'production');

    try {
      const result = await scanBuffer(Buffer.from('audio'), 'track.mp3', { allowUnscanned: 'audio' });
      expect(result.clean).toBe(true);

      const coverResult = await scanBuffer(Buffer.from('cover'), 'cover.jpg', { allowUnscanned: 'cover' });
      expect(coverResult.clean).toBe(false);

      process.env.ALLOW_UNSCANNED_COVERS = 'true';
      const allowedCoverResult = await scanBuffer(Buffer.from('cover'), 'cover.jpg', { allowUnscanned: 'cover' });
      expect(allowedCoverResult.clean).toBe(true);

      const unrelatedImageResult = await scanBuffer(Buffer.from('image'), 'image.jpg');
      expect(unrelatedImageResult.clean).toBe(false);
    } finally {
      process.env.VIRUS_SCANNER_ENABLED = original.enabled;
      process.env.ALLOW_UNSCANNED_AUDIO = original.allowUnscannedAudio;
      process.env.ALLOW_UNSCANNED_COVERS = original.allowUnscannedCovers;
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

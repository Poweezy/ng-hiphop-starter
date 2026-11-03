import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const storageMocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  from: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: storageMocks.createClient,
}));

import { SupabaseStorageProvider } from '../storage';

const bucket = {
  upload: vi.fn(),
  createSignedUploadUrl: vi.fn(),
  download: vi.fn(),
  remove: vi.fn(),
  getPublicUrl: vi.fn(),
};

describe('SupabaseStorageProvider', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  beforeEach(() => {
    vi.stubEnv('SUPABASE_URL', 'https://storage.example.test');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role-key');
    vi.stubEnv('SUPABASE_STORAGE_BUCKET', 'uploads');
    bucket.upload.mockReset();
    bucket.createSignedUploadUrl.mockReset();
    bucket.download.mockReset();
    bucket.remove.mockReset();
    bucket.getPublicUrl.mockReset();
    bucket.createSignedUploadUrl.mockResolvedValue({
      data: { signedUrl: 'https://storage.example.test/signed-upload' },
      error: null,
    });
    bucket.download.mockResolvedValue({
      data: new Blob([Buffer.from('verified media')]),
      error: null,
    });
    bucket.remove.mockResolvedValue({ error: null });
    bucket.upload.mockResolvedValue({ error: null });
    bucket.getPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://storage.example.test/public/uploads/covers/file.webp' },
    });
    storageMocks.from.mockReturnValue(bucket);
    storageMocks.createClient.mockReturnValue({
      storage: { from: storageMocks.from },
    });
  });

  it('creates a signed upload URL and scoped storage key', async () => {
    const storage = new SupabaseStorageProvider();
    const result = await storage.getPresignedUploadUrl('quarantine', 'audio/mpeg', 'track.mp3');

    expect(result.url).toBe('https://storage.example.test/signed-upload');
    expect(result.key).toMatch(/^quarantine\/track\.mp3-[\w-]+\.mpeg$/);
    expect(storage.supportsPresign()).toBe(true);
    expect(storageMocks.from).toHaveBeenCalledWith('uploads-quarantine');
  });

  it('downloads temporary media as a Buffer for scanning', async () => {
    const storage = new SupabaseStorageProvider();

    await expect(storage.downloadFile('quarantine/file.mp3')).resolves.toEqual(
      Buffer.from('verified media'),
    );
    expect(bucket.download).toHaveBeenCalledWith('quarantine/file.mp3');
    expect(storageMocks.from).toHaveBeenCalledWith('uploads-quarantine');
  });

  it('uploads verified media to the selected bucket', async () => {
    const storage = new SupabaseStorageProvider();

    const result = await storage.uploadFile(Buffer.from('image'), 'covers', 'image/webp');

    expect(bucket.upload).toHaveBeenCalledWith(
      expect.stringMatching(/^covers\/[\w-]+\.webp$/),
      expect.any(Buffer),
      { contentType: 'image/webp', upsert: true },
    );
    expect(result.url).toContain('/public/uploads/covers/file.webp');
  });

  it('surfaces storage cleanup errors', async () => {
    bucket.remove.mockResolvedValue({ error: { message: 'permission denied' } });
    const storage = new SupabaseStorageProvider();

    await expect(storage.deleteByKey('quarantine/file.mp3')).rejects.toThrow(
      'Supabase delete failed for quarantine/file.mp3: permission denied',
    );
    expect(storageMocks.from).toHaveBeenCalledWith('uploads-quarantine');
  });

  it('refuses to use the public media bucket as quarantine storage', () => {
    vi.stubEnv('SUPABASE_QUARANTINE_BUCKET', 'uploads');

    expect(() => new SupabaseStorageProvider()).toThrow(
      'Supabase quarantine storage must use a separate bucket',
    );
  });
});

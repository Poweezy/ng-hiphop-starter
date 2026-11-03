import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  scanBuffer: vi.fn(),
  optimizeImage: vi.fn(),
  recordRequest: vi.fn(),
  prisma: {
    song: {
      updateMany: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
  storage: {
    supportsPresign: vi.fn(),
    downloadFile: vi.fn(),
    uploadFile: vi.fn(),
    deleteByKey: vi.fn(),
  },
}));

vi.mock('@/app/api/_lib/admin', () => ({
  requireAdmin: mocks.requireAdmin,
}));
vi.mock('@/app/db', () => ({
  prisma: mocks.prisma,
}));
vi.mock('@/lib/storage', () => ({
  storage: mocks.storage,
}));
vi.mock('@/lib/uploadScanner', () => ({
  scanBuffer: mocks.scanBuffer,
}));
vi.mock('@/lib/imageOptimizer', () => ({
  optimizeImage: mocks.optimizeImage,
}));
vi.mock('@/lib/observability', () => ({
  recordRequest: mocks.recordRequest,
}));
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

import { POST } from '../route';

function makeRequest(body: Record<string, string>) {
  return new NextRequest('http://localhost:3000/api/songs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const uploadBody = {
  title: 'Test song',
  audioKey: 'quarantine/audio.mp3',
  audioContentType: 'audio/mpeg',
  audioFilename: 'audio.mp3',
  coverKey: 'quarantine/cover.png',
  coverContentType: 'image/png',
  coverFilename: 'cover.png',
};

describe('POST /api/songs direct uploads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({ session: { user: { role: 'ADMIN' } } });
    mocks.storage.supportsPresign.mockReturnValue(true);
    mocks.storage.downloadFile
      .mockResolvedValueOnce(Buffer.from('audio'))
      .mockResolvedValueOnce(Buffer.from('cover'));
    mocks.storage.uploadFile
      .mockResolvedValueOnce({ url: 'https://media.test/song.mpeg', key: 'songs/song.mpeg' })
      .mockResolvedValueOnce({ url: 'https://media.test/cover.webp', key: 'covers/cover.webp' });
    mocks.storage.deleteByKey.mockResolvedValue(undefined);
    mocks.scanBuffer.mockResolvedValue({ clean: true });
    mocks.optimizeImage.mockResolvedValue({
      buffer: Buffer.from('optimized-cover'),
      format: 'image/webp',
      width: 100,
      height: 100,
    });
    mocks.prisma.song.updateMany.mockResolvedValue({ count: 0 });
    mocks.prisma.song.create.mockResolvedValue({ id: 'song-1', title: 'Test song' });
    mocks.prisma.$transaction.mockImplementation((operations: Promise<unknown>[]) => Promise.all(operations));
  });

  it('scans and promotes quarantine media before creating the song', async () => {
    const response = await POST(makeRequest(uploadBody));

    expect(response.status).toBe(201);
    expect((await response.json()).data).toEqual({ id: 'song-1', title: 'Test song' });
    expect(mocks.scanBuffer).toHaveBeenCalledTimes(2);
    expect(mocks.storage.uploadFile).toHaveBeenCalledTimes(2);
    expect(mocks.prisma.song.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        file_key: 'songs/song.mpeg',
        cover_key: 'covers/cover.webp',
        is_active: true,
      }),
    });
    expect(mocks.storage.deleteByKey).toHaveBeenCalledWith('quarantine/audio.mp3');
    expect(mocks.storage.deleteByKey).toHaveBeenCalledWith('quarantine/cover.png');
  });

  it('rejects infected media and removes temporary objects without publishing', async () => {
    mocks.scanBuffer
      .mockResolvedValueOnce({ clean: false, reason: 'scanner rejected media' })
      .mockResolvedValueOnce({ clean: true });

    const response = await POST(makeRequest(uploadBody));

    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe('AUDIO_REJECTED');
    expect(mocks.storage.uploadFile).not.toHaveBeenCalled();
    expect(mocks.prisma.song.create).not.toHaveBeenCalled();
    expect(mocks.storage.deleteByKey).toHaveBeenCalledWith('quarantine/audio.mp3');
    expect(mocks.storage.deleteByKey).toHaveBeenCalledWith('quarantine/cover.png');
  });

  it('enforces the configured audio size before scanning or publication', async () => {
    mocks.storage.downloadFile
      .mockReset()
      .mockResolvedValueOnce(Buffer.alloc(50 * 1024 * 1024 + 1))
      .mockResolvedValueOnce(Buffer.from('cover'));

    const response = await POST(makeRequest(uploadBody));

    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe('AUDIO_TOO_LARGE');
    expect(mocks.scanBuffer).not.toHaveBeenCalled();
    expect(mocks.storage.uploadFile).not.toHaveBeenCalled();
    expect(mocks.prisma.song.create).not.toHaveBeenCalled();
  });

  it('rejects object keys outside the quarantine prefix', async () => {
    const response = await POST(makeRequest({ ...uploadBody, audioKey: 'songs/not-quarantined.mp3' }));

    expect(response.status).toBe(400);
    expect(mocks.storage.downloadFile).not.toHaveBeenCalled();
    expect(mocks.prisma.song.create).not.toHaveBeenCalled();
  });
});

import { writeFile, mkdir, unlink, stat } from 'fs/promises';
import { createWriteStream } from 'fs';
import { Readable } from 'stream';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import type { StorageProvider } from './storageProvider';

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';

// NOTE: This file previously only supported local filesystem storage.
// It now supports S3 (prod) and keeps a Local fallback (dev).

export type S3StorageOptions = {
  bucket: string;
  region: string;
  // If true, we return a public URL. Otherwise we return a time-limited signed URL.
  // For simplicity, we default to public URL.
  publicBaseUrl?: string; // e.g. https://my-bucket.s3.amazonaws.com
};

function required(name: string, value: string | undefined) {
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
}

async function streamToBuffer(stream: ReadableStream): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

function webStreamToNodeStream(stream: ReadableStream): Readable {
  return new Readable({
    async read() {
      const reader = stream.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          this.push(null);
          break;
        }
        this.push(Buffer.from(value));
      }
    },
  });
}

// Only allow safe folder names (no path separators, dots, etc.) to prevent
// path traversal when callers pass a `folder` for local storage.
function sanitizeFolder(folder: string): string {
  const cleaned = (folder || 'uploads').replace(/[^a-zA-Z0-9_-]/g, '');
  return cleaned || 'uploads';
}

// Strip path separators from a single segment (filename/key piece).
function sanitizeSegment(name: string): string {
  return (name || '').replace(/[^a-zA-Z0-9._-]/g, '');
}

// Resolve a local public path and confirm it stays inside publicDir.
function safeLocalPath(publicDir: string, relativeUrl: string): string | null {
  const resolved = path.resolve(publicDir, relativeUrl.replace(/^\/+/, ''));
  const dir = path.resolve(publicDir);
  if (resolved !== dir && !resolved.startsWith(dir + path.sep)) return null;
  return resolved;
}

export class LocalStorageProvider implements StorageProvider {
  private publicDir: string;

  constructor() {
    this.publicDir = path.join(process.cwd(), 'public');
  }

  async uploadFile(file: File | Buffer, folder: string, contentType?: string): Promise<{ url: string; key: string }> {
    const ext = contentType ? contentType.split('/')[1] || 'bin' : (file instanceof File ? sanitizeSegment(file.name.split('.').pop() || 'bin') : 'bin');
    const filename = `${uuidv4()}.${ext}`;
    const relativePath = path.join('uploads', sanitizeFolder(folder), filename);
    const absolutePath = path.resolve(this.publicDir, relativePath);

    if (!absolutePath.startsWith(path.resolve(this.publicDir) + path.sep)) {
      throw new Error('Invalid upload path');
    }

    await mkdir(path.dirname(absolutePath), { recursive: true });

    if (file instanceof File) {
      const stream = webStreamToNodeStream(file.stream());
      await new Promise<void>((resolve, reject) => {
        const ws = createWriteStream(absolutePath);
        stream.pipe(ws);
        ws.on('finish', resolve);
        ws.on('error', reject);
      });
    } else {
      await writeFile(absolutePath, file);
    }

    const url = `/${relativePath.replace(/\\/g, '/')}`;
    const key = relativePath.replace(/\\/g, '/');
    return { url, key };
  }

  async deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl.startsWith('/uploads/')) return;

    const absolutePath = safeLocalPath(this.publicDir, fileUrl);
    if (!absolutePath) return;

    try {
      await unlink(absolutePath);
    } catch (err) {
      // ignore missing
      return;
    }
  }

  async deleteByKey(key: string): Promise<void> {
    if (!key.startsWith('uploads/')) return;
    const absolutePath = path.resolve(this.publicDir, key);
    if (!absolutePath.startsWith(path.resolve(this.publicDir) + path.sep)) return;

    try {
      await unlink(absolutePath);
    } catch {
      // ignore missing
    }
  }

  async getPresignedUploadUrl(_folder: string, _contentType: string, _filename?: string): Promise<{ url: string; key: string }> {
    throw new Error('Presigned upload URLs are only supported with S3 storage');
  }

  supportsPresign(): boolean {
    return false;
  }
}

export class S3StorageProvider implements StorageProvider {
  private s3: S3Client;
  private bucket: string;
  private region: string;
  private publicBaseUrl?: string;
  private signedUrlTtlSeconds: number;

  constructor(opts: S3StorageOptions) {
    const { bucket, region, publicBaseUrl } = opts;
    this.bucket = bucket;
    this.region = region;
    this.publicBaseUrl = publicBaseUrl;
    this.signedUrlTtlSeconds = Number(process.env.S3_SIGNED_URL_TTL_SECONDS || '604800');

    if (!publicBaseUrl && process.env.NODE_ENV === 'production') {
      console.warn(
        'S3 storage is configured without S3_PUBLIC_BASE_URL. Media will be served via ' +
        `short-lived signed URLs (TTL ${this.signedUrlTtlSeconds}s) that expire and break playback. ` +
        'Set S3_PUBLIC_BASE_URL to a public bucket/CDN base URL for durable media.'
      );
    }

    required('AWS_ACCESS_KEY_ID', process.env.AWS_ACCESS_KEY_ID);
    required('AWS_SECRET_ACCESS_KEY', process.env.AWS_SECRET_ACCESS_KEY);

    this.s3 = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  private keyFor(folder: string, filename: string) {
    return `${sanitizeFolder(folder)}/${sanitizeSegment(filename)}`;
  }

  async uploadFile(file: File | Buffer, folder: string, contentType?: string): Promise<{ url: string; key: string }> {
    const ext = contentType ? contentType.split('/')[1] || 'bin' : (file instanceof File ? sanitizeSegment(file.name.split('.').pop() || 'bin') : 'bin');
    const filename = `${uuidv4()}.${ext}`;
    const key = this.keyFor(folder, filename);

    const body = file instanceof File ? webStreamToNodeStream(file.stream()) : file;

    const upload = new Upload({
      client: this.s3,
      params: {
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType || (file instanceof File ? file.type : undefined),
      },
    });

    await upload.done();

    if (this.publicBaseUrl) {
      const base = this.publicBaseUrl.replace(/\/+$/g, '');
      return { url: `${base}/${key}`, key };
    }

    const signedUrl = await getSignedUrl(this.s3, new GetObjectCommand({ Bucket: this.bucket, Key: key }), {
      expiresIn: this.signedUrlTtlSeconds,
    });

    return { url: signedUrl, key };
  }

  async getPresignedUploadUrl(folder: string, contentType: string, filename?: string): Promise<{ url: string; key: string }> {
    const ext = contentType.split('/')[1] || 'bin';
    const uniqueFilename = filename ? `${sanitizeSegment(filename)}-${uuidv4()}.${ext}` : `${uuidv4()}.${ext}`;
    const key = this.keyFor(folder, uniqueFilename);

    const url = await getSignedUrl(this.s3, new PutObjectCommand({ Bucket: this.bucket, Key: key }), {
      expiresIn: this.signedUrlTtlSeconds,
    });

    return { url, key };
  }

  supportsPresign(): boolean {
    return true;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    const publicBaseUrl = this.publicBaseUrl ? this.publicBaseUrl.replace(/\/+$/g, '') : null;

    let key: string | null = null;
    if (publicBaseUrl && fileUrl.startsWith(publicBaseUrl + '/')) {
      key = fileUrl.slice(publicBaseUrl.length + 1);
    } else {
      const u = new URL(fileUrl, 'http://localhost');
      key = u.pathname.replace(/^\/+/, '');
    }

    if (!key) return;
    await this.deleteByKey(key);
  }

  async deleteByKey(key: string): Promise<void> {
    if (!key) return;
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}

function makeStorage(): StorageProvider {
  const hasS3 = !!process.env.S3_BUCKET && !!process.env.AWS_REGION;
  if (hasS3) {
    const bucket = process.env.S3_BUCKET!;
    const region = process.env.AWS_REGION!;
    const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL;
    return new S3StorageProvider({ bucket, region, publicBaseUrl });
  }
  return new LocalStorageProvider();
}

// Factory + global instance
let storageInstance: StorageProvider | undefined;

export const storage: StorageProvider = storageInstance ?? (storageInstance = makeStorage());


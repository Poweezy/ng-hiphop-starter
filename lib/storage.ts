import { writeFile, mkdir, unlink, stat } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import type { StorageProvider } from './storageProvider';

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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

export class LocalStorageProvider implements StorageProvider {
  private publicDir: string;

  constructor() {
    this.publicDir = path.join(process.cwd(), 'public');
  }

  async uploadFile(file: File | Buffer, folder: string, contentType?: string): Promise<string> {
    const ext = contentType ? contentType.split('/')[1] || 'bin' : (file instanceof File ? file.name.split('.').pop() || 'bin' : 'bin');
    const filename = `${uuidv4()}.${ext}`;
    const relativePath = path.join('uploads', folder, filename);
    const absolutePath = path.join(this.publicDir, relativePath);

    await mkdir(path.dirname(absolutePath), { recursive: true });
    const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer().then(ab => new Uint8Array(ab))) : Buffer.from(file);
    await writeFile(absolutePath, buffer);

    return `/${relativePath.replace(/\\/g, '/')}`;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl.startsWith('/uploads/')) return;

    const absolutePath = path.join(this.publicDir, fileUrl);
    try {
      await unlink(absolutePath);
    } catch (err) {
      // ignore missing
      return;
    }
  }

  async getPresignedUploadUrl(_folder: string, _contentType: string, _filename?: string): Promise<{ url: string; key: string }> {
    throw new Error('Presigned upload URLs are only supported with S3 storage');
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
    this.signedUrlTtlSeconds = Number(process.env.S3_SIGNED_URL_TTL_SECONDS || '3600');

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
    return `${folder}/${filename}`;
  }

  async uploadFile(file: File | Buffer, folder: string, contentType?: string): Promise<string> {
    const ext = contentType ? contentType.split('/')[1] || 'bin' : (file instanceof File ? file.name.split('.').pop() || 'bin' : 'bin');
    const filename = `${uuidv4()}.${ext}`;
    const key = this.keyFor(folder, filename);

    const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer().then(ab => new Uint8Array(ab))) : Buffer.from(file);

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType || (file instanceof File ? file.type : undefined),
      })
    );

    if (this.publicBaseUrl) {
      const base = this.publicBaseUrl.replace(/\/+$/g, '');
      return `${base}/${key}`;
    }

    // Fallback: return signed URL
    return await getSignedUrl(this.s3, new GetObjectCommand({ Bucket: this.bucket, Key: key }), {
      expiresIn: this.signedUrlTtlSeconds,
    });
  }

  async getPresignedUploadUrl(folder: string, contentType: string, filename?: string): Promise<{ url: string; key: string }> {
    const ext = contentType.split('/')[1] || 'bin';
    const uniqueFilename = filename ? `${filename}-${uuidv4()}.${ext}` : `${uuidv4()}.${ext}`;
    const key = this.keyFor(folder, uniqueFilename);

    const url = await getSignedUrl(this.s3, new PutObjectCommand({ Bucket: this.bucket, Key: key }), {
      expiresIn: this.signedUrlTtlSeconds,
    });

    return { url, key };
  }

  async deleteFile(fileUrl: string): Promise<void> {
    // We support deletion only for URLs that include the S3 key (either publicBaseUrl path or signed URL won't be reliably parseable).
    // For signed URLs, the safer approach would be to store the key separately in DB.
    // Here we best-effort parse common public URL pattern.

    const publicBaseUrl = this.publicBaseUrl ? this.publicBaseUrl.replace(/\/+$/g, '') : null;

    let key: string | null = null;
    if (publicBaseUrl && fileUrl.startsWith(publicBaseUrl + '/')) {
      key = fileUrl.slice(publicBaseUrl.length + 1);
    } else {
      // try strip protocol/host and use last path segments
      const u = new URL(fileUrl, 'http://localhost');
      key = u.pathname.replace(/^\/+/, '');
    }

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


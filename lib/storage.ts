import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Common interface for storage operations to allow easy migration 
 * from local filesystem to cloud storage (S3, Vercel Blob, etc.)
 */
export interface StorageProvider {
  uploadFile(file: File, folder: string): Promise<string>;
  deleteFile(fileUrl: string): Promise<void>;
}

export class LocalStorageProvider implements StorageProvider {
  private publicDir: string;

  constructor() {
    this.publicDir = path.join(process.cwd(), 'public');
  }

  async uploadFile(file: File, folder: string): Promise<string> {
    const ext = file.name.split('.').pop() || 'bin';
    const filename = `${uuidv4()}.${ext}`;
    const relativePath = path.join('uploads', folder, filename);
    const absolutePath = path.join(this.publicDir, relativePath);

    // Ensure directory exists
    await mkdir(path.dirname(absolutePath), { recursive: true });

    // Write file
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(absolutePath, buffer);

    // Return the public URL path
    return `/${relativePath.replace(/\\/g, '/')}`;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl.startsWith('/uploads/')) return;

    const absolutePath = path.join(this.publicDir, fileUrl);
    try {
      await unlink(absolutePath);
    } catch (err) {
      console.error(`Failed to delete file: ${fileUrl}`, err);
    }
  }
}

// Global storage instance
export const storage = new LocalStorageProvider();

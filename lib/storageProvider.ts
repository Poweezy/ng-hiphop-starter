export interface StorageProvider {
  uploadFile(file: File | Buffer, folder: string, contentType?: string): Promise<{ url: string; key: string }>;
  getPresignedUploadUrl(folder: string, contentType: string, filename?: string): Promise<{ url: string; key: string }>;
  deleteFile(fileUrl: string): Promise<void>;
  deleteByKey(key: string): Promise<void>;
  supportsPresign(): boolean;
}


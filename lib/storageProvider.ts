export interface StorageProvider {
  uploadFile(file: File | Buffer, folder: string, contentType?: string): Promise<string>;
  getPresignedUploadUrl(folder: string, contentType: string, filename?: string): Promise<{ url: string; key: string }>;
  deleteFile(fileUrl: string): Promise<void>;
  supportsPresign(): boolean;
}


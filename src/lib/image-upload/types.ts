export interface ImageUploadOptions {
  alt?: string;
}

export interface ImageUploadResult {
  url: string;
  deleteUrl?: string;
}

export interface ImageProvider {
  upload(file: File | Buffer, options?: ImageUploadOptions): Promise<ImageUploadResult>;
}

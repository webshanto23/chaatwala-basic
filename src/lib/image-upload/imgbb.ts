import { ImageUploadOptions, ImageUploadResult, ImageProvider } from "./types";
import { compressImage } from "./compress";

const IMAGEBB_API_URL = "https://api.imgbb.com/1/upload";
const MAX_RETRIES = 2;

export class ImgbbProvider implements ImageProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async upload(file: File | Buffer, options?: ImageUploadOptions): Promise<ImageUploadResult> {
    const compressed = await compressImage(file);

    const formData = new FormData();
    const blob = new Blob([new Uint8Array(compressed)], { type: "image/jpeg" });
    formData.append("image", blob, options?.alt ? `${options.alt.replace(/\s+/g, "-").toLowerCase()}.jpg` : "upload.jpg");
    formData.append("key", this.apiKey);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(IMAGEBB_API_URL, {
          method: "POST",
          body: formData,
          signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => "Unknown error");
          throw new Error(`ImageBB upload failed: ${response.status} ${errorText}`);
        }

        const result = await response.json();

        if (!result.success || !result.data?.url) {
          throw new Error("ImageBB upload failed: missing url in response");
        }

        return {
          url: result.data.url,
          deleteUrl: result.data.delete_url || undefined,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    throw lastError || new Error("ImageBB upload failed after retries");
  }
}

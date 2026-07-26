import { ImageUploadOptions, ImageUploadResult, ImageProvider } from "./types";
import { ImgbbProvider } from "./imgbb";

let provider: ImageProvider | null = null;

function newImgbbProvider(): ImageProvider {
  const apiKey = process.env.IMAGEBB_API_KEY;
  if (!apiKey) {
    throw new Error("IMAGEBB_API_KEY is not set");
  }
  return new ImgbbProvider(apiKey);
}

function getProvider() {
  if (!provider) {
    const envProvider = process.env.IMAGE_PROVIDER || "imgbb";
    if (envProvider === "imgbb") {
      provider = newImgbbProvider();
    } else {
      throw new Error(`Unsupported IMAGE_PROVIDER: ${envProvider}`);
    }
  }
  return provider;
}

export async function uploadImage(file: File | Buffer, options?: ImageUploadOptions): Promise<ImageUploadResult> {
  return getProvider().upload(file, options);
}

export { ImgbbProvider } from "./imgbb";

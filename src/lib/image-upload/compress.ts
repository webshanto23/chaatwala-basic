import sharp from "sharp";

const MAX_WIDTH = 1200;
const QUALITY = 75;

export async function compressImage(input: File | Buffer): Promise<Buffer> {
  const buffer = input instanceof File ? Buffer.from(await input.arrayBuffer()) : input;

  const metadata = await sharp(buffer).metadata();
  
  if (metadata.width && metadata.width > MAX_WIDTH) {
    return sharp(buffer)
      .resize(MAX_WIDTH, null, { withoutEnlargement: true, fit: "inside" })
      .jpeg({ quality: QUALITY })
      .toBuffer();
  }

  if (metadata.format === "jpeg" || metadata.format === "png" || metadata.format === "webp") {
    return sharp(buffer)
      .jpeg({ quality: QUALITY })
      .toBuffer();
  }

  return sharp(buffer).toBuffer();
}

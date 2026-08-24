import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";

export type GalleryImage = { id: string; src: string; alt: string };

export async function getGalleryImages(): Promise<GalleryImage[]> {
  const images = await unstable_cache(
    () => prisma.galleryImage.findMany({
      select: { id: true, imageUrl: true, alt: true },
      orderBy: { createdAt: "asc" },
    }),
    ["about-gallery"],
    { revalidate: 300, tags: ["about-gallery"] },
  )();

  return images.map((image) => ({ id: image.id, src: image.imageUrl, alt: image.alt }));
}

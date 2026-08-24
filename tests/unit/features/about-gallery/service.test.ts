import { beforeEach, describe, expect, it, vi } from "vitest";
import { getGalleryImages } from "@/features/about-gallery/service";

vi.mock("@/lib/prisma", () => ({
  default: { galleryImage: { findMany: vi.fn() } },
}));
vi.mock("next/cache", () => ({ unstable_cache: (fn: () => Promise<unknown>) => fn }));

import prisma from "@/lib/prisma";

describe("getGalleryImages", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns stored images for server-side About rendering", async () => {
    vi.mocked(prisma.galleryImage.findMany).mockResolvedValue([
      { id: "gallery_1", imageUrl: "https://i.ibb.co/gallery.jpg", alt: "Street food" },
    ] as never);

    await expect(getGalleryImages()).resolves.toEqual([
      { id: "gallery_1", src: "https://i.ibb.co/gallery.jpg", alt: "Street food" },
    ]);
  });
});

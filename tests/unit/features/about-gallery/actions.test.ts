import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteGalleryImage, uploadGalleryImage } from "@/features/about-gallery/actions";

vi.mock("@/lib/prisma", () => ({
  default: {
    user: { findUnique: vi.fn() },
    galleryImage: { create: vi.fn(), findUnique: vi.fn(), delete: vi.fn() },
  },
}));
vi.mock("@/lib/authorize", () => ({ requireRole: vi.fn() }));
vi.mock("@/lib/image-upload", () => ({ uploadImage: vi.fn() }));
vi.mock("@/app/actions/audit", () => ({ logAction: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));

import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/authorize";
import { uploadImage } from "@/lib/image-upload";
import { revalidatePath, revalidateTag } from "next/cache";

const validId = "clq12345678901234567890123";

function galleryForm(file?: File) {
  const formData = new FormData();
  formData.set("alt", "Chaatwala team serving street food");
  if (file) formData.set("image", file);
  return formData;
}

describe("About gallery actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireRole).mockResolvedValue({ authorized: true, session: { user: { id: "admin_1" } }, role: "admin" } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "admin_1" } as never);
    vi.mocked(prisma.galleryImage.create).mockResolvedValue({ id: validId, alt: "Chaatwala team serving street food" } as never);
  });

  it.each(["unauthenticated", "user", "store manager"])('rejects %s uploads', async () => {
    vi.mocked(requireRole).mockResolvedValue({ authorized: false, session: null, role: null } as never);

    await expect(uploadGalleryImage(galleryForm())).resolves.toEqual({ error: "Forbidden" });
    expect(uploadImage).not.toHaveBeenCalled();
  });

  it("rejects invalid files before uploading", async () => {
    await expect(uploadGalleryImage(galleryForm(new File(["bad"], "image.txt", { type: "text/plain" })))).resolves.toEqual({
      error: "Only JPG, PNG, WEBP, or GIF images are allowed",
    });
    expect(uploadImage).not.toHaveBeenCalled();
  });

  it("uploads an admin gallery image and revalidates the About page", async () => {
    vi.mocked(uploadImage).mockResolvedValue({ url: "https://i.ibb.co/gallery.jpg", deleteUrl: "https://delete.example/new" });

    await expect(uploadGalleryImage(galleryForm(new File(["image"], "image.jpg", { type: "image/jpeg" })))).resolves.toEqual({ success: true });

    expect(prisma.galleryImage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ imageUrl: "https://i.ibb.co/gallery.jpg", createdById: "admin_1" }),
    });
    expect(revalidatePath).toHaveBeenCalledWith("/about");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/about");
    expect(revalidateTag).toHaveBeenCalledWith("about-gallery", "default");
  });

  it("cleans up a new upload when database creation fails", async () => {
    vi.mocked(uploadImage).mockResolvedValue({ url: "https://i.ibb.co/gallery.jpg", deleteUrl: "https://delete.example/new" });
    vi.mocked(prisma.galleryImage.create).mockRejectedValue(new Error("Database unavailable"));
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(uploadGalleryImage(galleryForm(new File(["image"], "image.jpg", { type: "image/jpeg" })))).resolves.toEqual({ error: "Database unavailable" });
    expect(fetchMock).toHaveBeenCalledWith("https://delete.example/new", expect.objectContaining({ method: "DELETE" }));
  });

  it("deletes an admin gallery image, revalidates, then cleans remote storage", async () => {
    vi.mocked(prisma.galleryImage.findUnique).mockResolvedValue({ id: validId, alt: "Gallery", imageDeleteUrl: "https://delete.example/old" } as never);
    vi.mocked(prisma.galleryImage.delete).mockResolvedValue({ id: validId } as never);
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(deleteGalleryImage(validId)).resolves.toEqual({ success: true });

    expect(prisma.galleryImage.delete).toHaveBeenCalledWith({ where: { id: validId } });
    expect(revalidatePath).toHaveBeenCalledWith("/about");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/about");
    expect(fetchMock).toHaveBeenCalledWith("https://delete.example/old", expect.objectContaining({ method: "DELETE" }));
  });
});

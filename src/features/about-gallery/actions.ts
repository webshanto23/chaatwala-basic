"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/authorize";
import { uploadImage } from "@/lib/image-upload";
import { logAction } from "@/app/actions/audit";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_EXTENSIONS = /\.(jpe?g|png|webp|gif)$/i;
const galleryImageSchema = z.object({
  alt: z.string().trim().min(1, "Alt text is required").max(160, "Alt text must be 160 characters or less"),
});

async function deleteStoredImage(deleteUrl: string | null | undefined, context: string) {
  if (!deleteUrl) return;
  try {
    await fetch(deleteUrl, { method: "DELETE", signal: AbortSignal.timeout(10_000) });
  } catch (error) {
    console.error(`Gallery image cleanup failed (${context})`, error);
  }
}

async function requireCurrentAdmin() {
  const { authorized, session } = await requireSuperAdmin();
  if (!authorized || !session?.user) return null;
  return prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true } });
}

export async function uploadGalleryImage(formData: FormData): Promise<{ success: true } | { error: string }> {
  const actingUser = await requireCurrentAdmin();
  if (!actingUser) return { error: "Forbidden" };

  const parsed = galleryImageSchema.safeParse({ alt: formData.get("alt") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid gallery image" };

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return { error: "Image is required" };
  if (!ALLOWED_TYPES.includes(file.type)) return { error: "Only JPG, PNG, WEBP, or GIF images are allowed" };
  if (!ALLOWED_EXTENSIONS.test(file.name)) return { error: "Image file extension must be JPG, PNG, WEBP, or GIF" };
  if (file.size > MAX_FILE_SIZE) return { error: "Image must be 5MB or less" };

  let uploadedImage: { url: string; deleteUrl?: string } | null = null;
  let createdGalleryImage: { id: string; alt: string } | null = null;
  try {
    uploadedImage = await uploadImage(file, { alt: parsed.data.alt });
    const imageUrl = new URL(uploadedImage.url);
    if (imageUrl.protocol !== "https:") throw new Error("Image upload returned an invalid URL");

    createdGalleryImage = await prisma.galleryImage.create({
      data: {
        imageUrl: uploadedImage.url,
        imageDeleteUrl: uploadedImage.deleteUrl ?? null,
        alt: parsed.data.alt,
        createdById: actingUser.id,
      },
    });
  } catch (error) {
    await deleteStoredImage(uploadedImage?.deleteUrl, "new upload after database failure");
    return { error: error instanceof Error ? error.message : "Could not upload gallery image" };
  }

  try {
    await logAction({
      userId: actingUser.id,
      action: "GALLERY_IMAGE_UPLOAD",
      entity: "GalleryImage",
      entityId: createdGalleryImage?.id,
      metadata: { alt: createdGalleryImage?.alt },
    });
  } catch (error) {
    console.error("Gallery image upload audit logging failed", error);
  }

  revalidatePath("/about");
  revalidatePath("/staff/content/about");
  revalidateTag("about-gallery", "default");
  return { success: true };
}

export async function deleteGalleryImage(id: string): Promise<{ success: true } | { error: string }> {
  const actingUser = await requireCurrentAdmin();
  if (!actingUser) return { error: "Forbidden" };
  if (!z.string().cuid().safeParse(id).success) return { error: "Invalid gallery image" };

  const galleryImage = await prisma.galleryImage.findUnique({ where: { id } });
  if (!galleryImage) return { error: "Gallery image not found" };

  await prisma.galleryImage.delete({ where: { id } });
  try {
    await logAction({
      userId: actingUser.id,
      action: "GALLERY_IMAGE_DELETE",
      entity: "GalleryImage",
      entityId: galleryImage.id,
      metadata: { alt: galleryImage.alt },
    });
  } catch (error) {
    console.error("Gallery image deletion audit logging failed", error);
  }
  revalidatePath("/about");
  revalidatePath("/staff/content/about");
  revalidateTag("about-gallery", "default");
  await deleteStoredImage(galleryImage.imageDeleteUrl, "after database deletion");

  return { success: true };
}

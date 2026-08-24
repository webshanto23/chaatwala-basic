"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/authorize";
import { uploadImage } from "@/lib/image-upload";
import { logAction } from "@/app/actions/audit";
import { isSiteSettingsTableMissing } from "./service";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_EXTENSIONS = /\.(jpe?g|png|webp|gif)$/i;
const heroSettingsSchema = z.object({
  heroImageAlt: z.string().trim().min(1, "Alt text is required").max(160, "Alt text must be 160 characters or less"),
});

async function deleteStoredImage(deleteUrl: string | null | undefined, context: string) {
  if (!deleteUrl) return;
  try {
    await fetch(deleteUrl, { method: "DELETE", signal: AbortSignal.timeout(10_000) });
  } catch (error) {
    console.error(`Hero image cleanup failed (${context})`, error);
  }
}

export async function updateHeroSettings(formData: FormData): Promise<{ success: true } | { error: string }> {
  const { authorized, session } = await requireRole("admin");
  if (!authorized || !session?.user) return { error: "Forbidden" };

  const actingUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });
  if (!actingUser) {
    return { error: "Your session is no longer valid. Please sign out and sign in again." };
  }

  const parsed = heroSettingsSchema.safeParse({ heroImageAlt: formData.get("heroImageAlt") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid hero settings" };

  const imageValue = formData.get("image");
  if (imageValue && !(imageValue instanceof File)) return { error: "Invalid image" };
  if (imageValue instanceof File && imageValue.size === 0) return { error: "Image cannot be empty" };
  if (imageValue instanceof File && !ALLOWED_TYPES.includes(imageValue.type)) {
    return { error: "Only JPG, PNG, WEBP, or GIF images are allowed" };
  }
  if (imageValue instanceof File && !ALLOWED_EXTENSIONS.test(imageValue.name)) {
    return { error: "Image file extension must be JPG, PNG, WEBP, or GIF" };
  }
  if (imageValue instanceof File && imageValue.size > MAX_FILE_SIZE) return { error: "Image must be 5MB or less" };

  let existing;
  try {
    existing = await prisma.siteSetting.findUnique({ where: { id: "global" } });
  } catch (error) {
    if (isSiteSettingsTableMissing(error)) {
      return { error: "Hero settings are unavailable until the latest database migration is applied" };
    }
    return { error: "Could not load current hero settings" };
  }
  let uploadedImage: { url: string; deleteUrl?: string } | null = null;

  try {
    if (imageValue instanceof File) {
      uploadedImage = await uploadImage(imageValue, { alt: parsed.data.heroImageAlt });
      const imageUrl = new URL(uploadedImage.url);
      if (imageUrl.protocol !== "https:") throw new Error("Image upload returned an invalid URL");
    }

    await prisma.siteSetting.upsert({
      where: { id: "global" },
      create: {
        id: "global",
        heroImageUrl: uploadedImage?.url,
        heroImageAlt: parsed.data.heroImageAlt,
        heroImageDeleteUrl: uploadedImage?.deleteUrl ?? null,
        updatedById: actingUser.id,
      },
      update: {
        heroImageUrl: uploadedImage?.url ?? existing?.heroImageUrl ?? null,
        heroImageAlt: parsed.data.heroImageAlt,
        heroImageDeleteUrl: uploadedImage?.deleteUrl ?? existing?.heroImageDeleteUrl ?? null,
        updatedById: actingUser.id,
      },
    });
  } catch (error) {
    await deleteStoredImage(uploadedImage?.deleteUrl, "new upload after settings update failure");
    if (isSiteSettingsTableMissing(error)) {
      return { error: "Hero settings are unavailable until the latest database migration is applied" };
    }
    return { error: error instanceof Error ? error.message : "Could not save hero settings" };
  }

  await logAction({
    userId: actingUser.id,
    action: "HERO_SETTINGS_UPDATE",
    entity: "SiteSetting",
    entityId: "global",
    metadata: { imageReplaced: Boolean(uploadedImage) },
  });

  revalidatePath("/");
  revalidateTag("site-settings", "default");

  if (uploadedImage && existing?.heroImageDeleteUrl) {
    await deleteStoredImage(existing.heroImageDeleteUrl, "previous hero after successful replacement");
  }

  return { success: true };
}

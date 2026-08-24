import { unstable_cache } from "next/cache";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

export const HERO_IMAGE_FALLBACK = "/images/banner.jpg";
export const HERO_IMAGE_ALT_FALLBACK = "Delicious street food spread";

export type HeroSettings = {
  imageUrl: string | null;
  imageAlt: string;
};

export function isSiteSettingsTableMissing(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";
}

export async function getHeroSettings(): Promise<HeroSettings> {
  let settings: { heroImageUrl: string | null; heroImageAlt: string } | null;
  try {
    settings = await unstable_cache(
      () => prisma.siteSetting.findUnique({
        where: { id: "global" },
        select: { heroImageUrl: true, heroImageAlt: true },
      }),
      ["hero-settings"],
      { revalidate: 300, tags: ["site-settings"] },
    )();
  } catch (error) {
    if (!isSiteSettingsTableMissing(error)) throw error;
    settings = null;
  }

  return {
    imageUrl: settings?.heroImageUrl ?? null,
    imageAlt: settings?.heroImageAlt ?? HERO_IMAGE_ALT_FALLBACK,
  };
}

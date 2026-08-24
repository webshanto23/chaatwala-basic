import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { getHeroSettings, HERO_IMAGE_ALT_FALLBACK } from "@/features/site-settings/service";

vi.mock("@/lib/prisma", () => ({
  default: { siteSetting: { findUnique: vi.fn() } },
}));
vi.mock("next/cache", () => ({
  unstable_cache: (fn: () => Promise<unknown>) => fn,
}));

import prisma from "@/lib/prisma";

describe("getHeroSettings", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the saved hero image for server rendering", async () => {
    vi.mocked(prisma.siteSetting.findUnique).mockResolvedValue({
      heroImageUrl: "https://i.ibb.co/hero.jpg", heroImageAlt: "Fresh chaat",
    } as never);

    await expect(getHeroSettings()).resolves.toEqual({ imageUrl: "https://i.ibb.co/hero.jpg", imageAlt: "Fresh chaat" });
  });

  it("uses the fallback values when settings do not exist", async () => {
    vi.mocked(prisma.siteSetting.findUnique).mockResolvedValue(null);

    await expect(getHeroSettings()).resolves.toEqual({ imageUrl: null, imageAlt: HERO_IMAGE_ALT_FALLBACK });
  });

  it("uses fallback values while the settings migration is pending", async () => {
    vi.mocked(prisma.siteSetting.findUnique).mockRejectedValue(new Prisma.PrismaClientKnownRequestError("Missing table", {
      code: "P2021",
      clientVersion: "test",
    }));

    await expect(getHeroSettings()).resolves.toEqual({ imageUrl: null, imageAlt: HERO_IMAGE_ALT_FALLBACK });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { updateHeroSettings } from "@/features/site-settings/actions";

vi.mock("@/lib/prisma", () => ({
  default: {
    siteSetting: { findUnique: vi.fn(), upsert: vi.fn() },
    user: { findUnique: vi.fn() },
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

const heroForm = (file?: File) => {
  const formData = new FormData();
  formData.set("heroImageAlt", "Fresh chaat and street food");
  if (file) formData.set("image", file);
  return formData;
};

describe("updateHeroSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireRole).mockResolvedValue({ authorized: true, session: { user: { id: "admin_1" } }, role: "admin" } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "admin_1" } as never);
    vi.mocked(prisma.siteSetting.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.siteSetting.upsert).mockResolvedValue({ id: "global" } as never);
  });

  it.each(["unauthenticated", "user", "store manager"])('rejects %s callers', async () => {
    vi.mocked(requireRole).mockResolvedValue({ authorized: false, session: null, role: null } as never);

    await expect(updateHeroSettings(heroForm())).resolves.toEqual({ error: "Forbidden" });
    expect(requireRole).toHaveBeenCalledWith("admin");
    expect(prisma.siteSetting.upsert).not.toHaveBeenCalled();
  });

  it("rejects an invalid image before upload", async () => {
    const result = await updateHeroSettings(heroForm(new File(["bad"], "hero.txt", { type: "text/plain" })));

    expect(result).toEqual({ error: "Only JPG, PNG, WEBP, or GIF images are allowed" });
    expect(uploadImage).not.toHaveBeenCalled();
  });

  it("rejects a stale session before uploading or modifying settings", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await expect(updateHeroSettings(heroForm())).resolves.toEqual({
      error: "Your session is no longer valid. Please sign out and sign in again.",
    });
    expect(prisma.siteSetting.upsert).not.toHaveBeenCalled();
    expect(uploadImage).not.toHaveBeenCalled();
  });

  it("returns a migration-required error instead of crashing when SiteSetting is absent", async () => {
    vi.mocked(prisma.siteSetting.findUnique).mockRejectedValue(new Prisma.PrismaClientKnownRequestError("Missing table", {
      code: "P2021",
      clientVersion: "test",
    }));

    await expect(updateHeroSettings(heroForm())).resolves.toEqual({
      error: "Hero settings are unavailable until the latest database migration is applied",
    });
  });

  it("rejects an image with an unsafe extension before upload", async () => {
    const result = await updateHeroSettings(heroForm(new File(["image"], "hero.exe", { type: "image/jpeg" })));

    expect(result).toEqual({ error: "Image file extension must be JPG, PNG, WEBP, or GIF" });
    expect(uploadImage).not.toHaveBeenCalled();
  });

  it("cleans up a malformed upload response without changing settings", async () => {
    vi.mocked(uploadImage).mockResolvedValue({ url: "not-a-url", deleteUrl: "https://new.example/delete" });
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(updateHeroSettings(heroForm(new File(["image"], "hero.jpg", { type: "image/jpeg" })))).resolves.toEqual({ error: "Invalid URL" });
    expect(prisma.siteSetting.upsert).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith("https://new.example/delete", expect.objectContaining({ method: "DELETE" }));
  });

  it("saves a new image, revalidates the homepage, then cleans up the previous image", async () => {
    vi.mocked(prisma.siteSetting.findUnique).mockResolvedValue({
      id: "global", heroImageUrl: "https://old.example/hero.jpg", heroImageDeleteUrl: "https://old.example/delete",
    } as never);
    vi.mocked(uploadImage).mockResolvedValue({ url: "https://i.ibb.co/new-hero.jpg", deleteUrl: "https://new.example/delete" });
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(updateHeroSettings(heroForm(new File(["image"], "hero.jpg", { type: "image/jpeg" })))).resolves.toEqual({ success: true });

    expect(prisma.siteSetting.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ heroImageUrl: "https://i.ibb.co/new-hero.jpg", updatedById: "admin_1" }),
      update: expect.objectContaining({ heroImageDeleteUrl: "https://new.example/delete" }),
    }));
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidateTag).toHaveBeenCalledWith("site-settings", "default");
    expect(fetchMock).toHaveBeenCalledWith("https://old.example/delete", expect.objectContaining({ method: "DELETE" }));
  });

  it("keeps the previous image when upload fails", async () => {
    vi.mocked(uploadImage).mockRejectedValue(new Error("ImageBB unavailable"));

    await expect(updateHeroSettings(heroForm(new File(["image"], "hero.jpg", { type: "image/jpeg" })))).resolves.toEqual({ error: "ImageBB unavailable" });
    expect(prisma.siteSetting.upsert).not.toHaveBeenCalled();
  });

  it("cleans up only the new upload if the database update fails", async () => {
    vi.mocked(prisma.siteSetting.findUnique).mockResolvedValue({ id: "global", heroImageDeleteUrl: "https://old.example/delete" } as never);
    vi.mocked(uploadImage).mockResolvedValue({ url: "https://i.ibb.co/new-hero.jpg", deleteUrl: "https://new.example/delete" });
    vi.mocked(prisma.siteSetting.upsert).mockRejectedValue(new Error("Database unavailable"));
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(updateHeroSettings(heroForm(new File(["image"], "hero.jpg", { type: "image/jpeg" })))).resolves.toEqual({ error: "Database unavailable" });
    expect(fetchMock).toHaveBeenCalledWith("https://new.example/delete", expect.objectContaining({ method: "DELETE" }));
    expect(fetchMock).not.toHaveBeenCalledWith("https://old.example/delete", expect.anything());
  });
});

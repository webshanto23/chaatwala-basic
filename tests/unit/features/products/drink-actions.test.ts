import { describe, it, expect, vi, beforeEach } from "vitest";
import { createDrink, updateDrink, deleteDrink, getDrinks } from "@/features/products/actions";

vi.mock("@/lib/prisma", () => ({
  default: {
    drink: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@/lib/authorize", () => ({
  authorize: vi.fn(),
  requirePermission: vi.fn(),
}));

vi.mock("@/app/actions/audit", () => ({
  logAction: vi.fn(),
}));

vi.mock("@/lib/image-upload", () => ({
  uploadImage: vi.fn(() => Promise.resolve({ url: "https://example.com/drink.jpg", deleteUrl: "https://example.com/delete" })),
}));

vi.mock("next/cache", () => ({
  unstable_cache: vi.fn((fn: () => Promise<unknown>) => {
    let cached: Promise<unknown> | null = null;
    return () => {
      if (!cached) {
        cached = fn();
      }
      return cached;
    };
  }),
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

import prisma from "@/lib/prisma";
import { authorize, requirePermission } from "@/lib/authorize";

const mockDrink = {
  id: "drink_1",
  name: "Test Drink",
  slug: "test-drink",
  price: 100,
  discountPrice: null,
  description: "A test drink",
  isAvailable: true,
  tag: "popular",
  imageUrl: "https://example.com/drink.jpg",
  imageDeleteUrl: "https://example.com/delete",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("drink actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createDrink", () => {
    it("creates drink with valid data when authorized", async () => {
      vi.mocked(requirePermission).mockResolvedValue({ authorized: true, session: { user: { id: "admin_1" } } } as any);
      vi.mocked(prisma.drink.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.drink.create).mockResolvedValue(mockDrink as any);

      const formData = new FormData();
      formData.append("name", "Test Drink");
      formData.append("price", "100");
      formData.append("tag", "popular");
      formData.append("image", new File(["test"], "drink.jpg", { type: "image/jpeg" }));

      const result = await createDrink(formData);
      expect(result).toEqual({ success: true, drink: expect.objectContaining({ id: "drink_1" }) });
      expect(prisma.drink.create).toHaveBeenCalled();
    });

    it("returns error when not authorized", async () => {
      vi.mocked(requirePermission).mockResolvedValue({ authorized: false, session: null } as any);

      const formData = new FormData();
      formData.append("name", "Test Drink");
      formData.append("image", new File(["test"], "drink.jpg", { type: "image/jpeg" }));

      const result = await createDrink(formData);
      expect(result).toEqual({ error: "You do not have permission to create drinks" });
    });

    it("returns error when image is missing", async () => {
      vi.mocked(requirePermission).mockResolvedValue({ authorized: true, session: { user: { id: "admin_1" } } } as any);

      const formData = new FormData();
      formData.append("name", "Test Drink");

      const result = await createDrink(formData);
      expect(result).toEqual({ error: "Image is required" });
    });

    it("returns error when price is negative", async () => {
      vi.mocked(requirePermission).mockResolvedValue({ authorized: true, session: { user: { id: "admin_1" } } } as any);

      const formData = new FormData();
      formData.append("name", "Test Drink");
      formData.append("price", "-50");
      formData.append("image", new File(["test"], "drink.jpg", { type: "image/jpeg" }));

      const result = await createDrink(formData);
      expect(result).toEqual({ error: "Price must be a positive number" });
    });
  });

  describe("updateDrink", () => {
    it("updates drink when authorized", async () => {
      vi.mocked(requirePermission).mockResolvedValue({ authorized: true, session: { user: { id: "admin_1" } } } as any);
      vi.mocked(prisma.drink.findUnique).mockResolvedValue(mockDrink as any);
      vi.mocked(prisma.drink.update).mockResolvedValue({ ...mockDrink, name: "Updated Drink" } as any);

      const formData = new FormData();
      formData.append("name", "Updated Drink");
      formData.append("price", "150");

      const result = await updateDrink("drink_1", formData);
      expect(result).toEqual({ success: true, drink: expect.objectContaining({ name: "Updated Drink" }) });
    });

    it("returns error when drink not found", async () => {
      vi.mocked(requirePermission).mockResolvedValue({ authorized: true, session: { user: { id: "admin_1" } } } as any);
      vi.mocked(prisma.drink.findUnique).mockResolvedValue(null);

      const formData = new FormData();
      formData.append("name", "Updated Drink");

      const result = await updateDrink("nonexistent", formData);
      expect(result).toEqual({ error: "Drink not found" });
    });
  });

  describe("deleteDrink", () => {
    it("deletes drink when authorized", async () => {
      vi.mocked(requirePermission).mockResolvedValue({ authorized: true, session: { user: { id: "admin_1" } } } as any);
      vi.mocked(prisma.drink.findUnique).mockResolvedValue(mockDrink as any);
      vi.mocked(prisma.drink.delete).mockResolvedValue(mockDrink as any);

      const result = await deleteDrink("drink_1");
      expect(result).toEqual({ success: true });
      expect(prisma.drink.delete).toHaveBeenCalledWith({ where: { id: "drink_1" } });
    });

    it("returns error when drink not found", async () => {
      vi.mocked(requirePermission).mockResolvedValue({ authorized: true, session: { user: { id: "admin_1" } } } as any);
      vi.mocked(prisma.drink.findUnique).mockResolvedValue(null);

      const result = await deleteDrink("nonexistent");
      expect(result).toEqual({ error: "Drink not found" });
    });
  });

  describe("getDrinks", () => {
    it("returns drinks when authorized", async () => {
      vi.mocked(authorize).mockResolvedValue({ authorized: true, session: null } as any);
      vi.mocked(prisma.drink.findMany).mockResolvedValue([mockDrink] as any);

      const result = await getDrinks();
      expect(result).toEqual({ drinks: [expect.objectContaining({ id: "drink_1" })], nextCursor: null });
    });

    it("returns error when not authorized", async () => {
      vi.mocked(authorize).mockResolvedValue({ authorized: false, session: null } as any);

      const result = await getDrinks();
      expect(result).toEqual({ error: "Forbidden" });
    });
  });
});

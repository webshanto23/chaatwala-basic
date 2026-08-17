import { describe, it, expect, vi, beforeEach } from "vitest";
import { createDish, updateDish, deleteDish, getDishes } from "@/features/products/actions";

vi.mock("@/lib/prisma", () => ({
  default: {
    dish: {
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
  uploadImage: vi.fn(() => Promise.resolve({ url: "https://example.com/dish.jpg", deleteUrl: "https://example.com/delete" })),
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

const mockDish = {
  id: "dish_1",
  name: "Test Dish",
  slug: "test-dish",
  price: 200,
  discountPrice: 150,
  description: "A test dish",
  isAvailable: true,
  tag: "popular",
  imageUrl: "https://example.com/dish.jpg",
  imageDeleteUrl: "https://example.com/delete",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("dish actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createDish", () => {
    it("creates dish with valid data when authorized", async () => {
      vi.mocked(requirePermission).mockResolvedValue({ authorized: true, session: { user: { id: "admin_1" } } } as any);
      vi.mocked(prisma.dish.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.dish.create).mockResolvedValue(mockDish as any);

      const formData = new FormData();
      formData.append("name", "Test Dish");
      formData.append("price", "200");
      formData.append("discountPrice", "150");
      formData.append("description", "A test dish");
      formData.append("tag", "popular");
      formData.append("isAvailable", "true");
      formData.append("image", new File(["test"], "dish.jpg", { type: "image/jpeg" }));

      const result = await createDish(formData);
      expect(result).toEqual({ success: true, dish: expect.objectContaining({ id: "dish_1" }) });
      expect(prisma.dish.create).toHaveBeenCalled();
    });

    it("returns error when not authorized", async () => {
      vi.mocked(requirePermission).mockResolvedValue({ authorized: false, session: null } as any);

      const formData = new FormData();
      formData.append("name", "Test Dish");
      formData.append("image", new File(["test"], "dish.jpg", { type: "image/jpeg" }));

      const result = await createDish(formData);
      expect(result).toEqual({ error: "You do not have permission to create dishes" });
    });

    it("returns error when image is missing", async () => {
      vi.mocked(requirePermission).mockResolvedValue({ authorized: true, session: { user: { id: "admin_1" } } } as any);

      const formData = new FormData();
      formData.append("name", "Test Dish");

      const result = await createDish(formData);
      expect(result).toEqual({ error: "Image is required" });
    });

    it("returns error when image type is invalid", async () => {
      vi.mocked(requirePermission).mockResolvedValue({ authorized: true, session: { user: { id: "admin_1" } } } as any);

      const formData = new FormData();
      formData.append("name", "Test Dish");
      formData.append("image", new File(["test"], "dish.txt", { type: "text/plain" }));

      const result = await createDish(formData);
      expect(result).toEqual({ error: "Only JPG, PNG, WEBP, or GIF images are allowed" });
    });

    it("returns error when price is negative", async () => {
      vi.mocked(requirePermission).mockResolvedValue({ authorized: true, session: { user: { id: "admin_1" } } } as any);

      const formData = new FormData();
      formData.append("name", "Test Dish");
      formData.append("price", "-100");
      formData.append("image", new File(["test"], "dish.jpg", { type: "image/jpeg" }));

      const result = await createDish(formData);
      expect(result).toEqual({ error: "Price must be a positive number" });
    });

    it("returns error when name is too short", async () => {
      vi.mocked(requirePermission).mockResolvedValue({ authorized: true, session: { user: { id: "admin_1" } } } as any);

      const formData = new FormData();
      formData.append("name", "A");
      formData.append("price", "100");
      formData.append("image", new File(["test"], "dish.jpg", { type: "image/jpeg" }));

      const result = await createDish(formData);
      expect(result).toEqual({ error: "Name must be at least 2 characters" });
    });
  });

  describe("updateDish", () => {
    it("updates dish when authorized", async () => {
      vi.mocked(requirePermission).mockResolvedValue({ authorized: true, session: { user: { id: "admin_1" } } } as any);
      vi.mocked(prisma.dish.findUnique).mockResolvedValue(mockDish as any);
      vi.mocked(prisma.dish.update).mockResolvedValue({ ...mockDish, name: "Updated Dish" } as any);

      const formData = new FormData();
      formData.append("name", "Updated Dish");
      formData.append("price", "250");

      const result = await updateDish("dish_1", formData);
      expect(result).toEqual({ success: true, dish: expect.objectContaining({ name: "Updated Dish" }) });
      expect(prisma.dish.update).toHaveBeenCalledWith({
        where: { id: "dish_1" },
        data: expect.objectContaining({ name: "Updated Dish" }),
      });
    });

    it("returns error when dish not found", async () => {
      vi.mocked(requirePermission).mockResolvedValue({ authorized: true, session: { user: { id: "admin_1" } } } as any);
      vi.mocked(prisma.dish.findUnique).mockResolvedValue(null);

      const formData = new FormData();
      formData.append("name", "Updated Dish");

      const result = await updateDish("nonexistent", formData);
      expect(result).toEqual({ error: "Dish not found" });
    });

    it("returns error when not authorized", async () => {
      vi.mocked(requirePermission).mockResolvedValue({ authorized: false, session: null } as any);

      const formData = new FormData();
      formData.append("name", "Updated Dish");

      const result = await updateDish("dish_1", formData);
      expect(result).toEqual({ error: "You do not have permission to update dishes" });
    });
  });

  describe("deleteDish", () => {
    it("deletes dish when authorized", async () => {
      vi.mocked(requirePermission).mockResolvedValue({ authorized: true, session: { user: { id: "admin_1" } } } as any);
      vi.mocked(prisma.dish.findUnique).mockResolvedValue(mockDish as any);
      vi.mocked(prisma.dish.delete).mockResolvedValue(mockDish as any);

      const result = await deleteDish("dish_1");
      expect(result).toEqual({ success: true });
      expect(prisma.dish.delete).toHaveBeenCalledWith({ where: { id: "dish_1" } });
    });

    it("returns error when dish not found", async () => {
      vi.mocked(requirePermission).mockResolvedValue({ authorized: true, session: { user: { id: "admin_1" } } } as any);
      vi.mocked(prisma.dish.findUnique).mockResolvedValue(null);

      const result = await deleteDish("nonexistent");
      expect(result).toEqual({ error: "Dish not found" });
    });

    it("returns error when not authorized", async () => {
      vi.mocked(requirePermission).mockResolvedValue({ authorized: false, session: null } as any);

      const result = await deleteDish("dish_1");
      expect(result).toEqual({ error: "You do not have permission to delete dishes" });
    });
  });

  describe("getDishes", () => {
    it("returns dishes when authorized", async () => {
      vi.mocked(authorize).mockResolvedValue({ authorized: true, session: null } as any);
      vi.mocked(prisma.dish.findMany).mockResolvedValue([mockDish] as any);

      const result = await getDishes();
      expect(result).toEqual({ dishes: [expect.objectContaining({ id: "dish_1" })], nextCursor: null });
    });

    it("returns error when not authorized", async () => {
      vi.mocked(authorize).mockResolvedValue({ authorized: false, session: null } as any);

      const result = await getDishes();
      expect(result).toEqual({ error: "Forbidden" });
    });

    it("returns nextCursor when there are more items", async () => {
      vi.mocked(authorize).mockResolvedValue({ authorized: true, session: null } as any);
      const manyDishes = Array.from({ length: 20 }, (_, i) => ({
        ...mockDish,
        id: `dish_${i}`,
        slug: `dish-${i}`,
      }));
      vi.mocked(prisma.dish.findMany).mockResolvedValue(manyDishes as any);

      const result = await getDishes({ limit: 20 });
      expect(result.dishes).toHaveLength(20);
      expect(result.nextCursor).toBe("dish_19");
    });
  });
});

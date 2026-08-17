import { describe, it, expect, vi, beforeEach } from "vitest";
import { createDish, updateDish, getDishes } from "@/features/products/actions";

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
import { requirePermission, authorize } from "@/lib/authorize";

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

describe("pricing and discount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createDish with discountPrice", () => {
    it("creates dish with discountPrice less than price", async () => {
      vi.mocked(requirePermission).mockResolvedValue({ authorized: true, session: { user: { id: "admin_1" } } } as any);
      vi.mocked(prisma.dish.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.dish.create).mockResolvedValue({ ...mockDish, discountPrice: 150 } as any);

      const formData = new FormData();
      formData.append("name", "Test Dish");
      formData.append("price", "200");
      formData.append("discountPrice", "150");
      formData.append("image", new File(["test"], "dish.jpg", { type: "image/jpeg" }));

      const result = await createDish(formData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.dish.discountPrice).toBe(150);
        expect(result.dish.price).toBe(200);
      }
    });

    it("creates dish with discountPrice equal to price", async () => {
      vi.mocked(requirePermission).mockResolvedValue({ authorized: true, session: { user: { id: "admin_1" } } } as any);
      vi.mocked(prisma.dish.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.dish.create).mockResolvedValue({ ...mockDish, discountPrice: 200 } as any);

      const formData = new FormData();
      formData.append("name", "Test Dish");
      formData.append("price", "200");
      formData.append("discountPrice", "200");
      formData.append("image", new File(["test"], "dish.jpg", { type: "image/jpeg" }));

      const result = await createDish(formData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.dish.discountPrice).toBe(200);
      }
    });

    it("creates dish without discountPrice", async () => {
      vi.mocked(requirePermission).mockResolvedValue({ authorized: true, session: { user: { id: "admin_1" } } } as any);
      vi.mocked(prisma.dish.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.dish.create).mockResolvedValue({ ...mockDish, discountPrice: null } as any);

      const formData = new FormData();
      formData.append("name", "Test Dish");
      formData.append("price", "200");
      formData.append("image", new File(["test"], "dish.jpg", { type: "image/jpeg" }));

      const result = await createDish(formData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.dish.discountPrice).toBeNull();
      }
    });

    it("rejects negative discountPrice", async () => {
      vi.mocked(requirePermission).mockResolvedValue({ authorized: true, session: { user: { id: "admin_1" } } } as any);

      const formData = new FormData();
      formData.append("name", "Test Dish");
      formData.append("price", "200");
      formData.append("discountPrice", "-50");
      formData.append("image", new File(["test"], "dish.jpg", { type: "image/jpeg" }));

      const result = await createDish(formData);
      expect(result).toEqual({ error: "Discount price cannot be negative" });
    });
  });

  describe("updateDish discountPrice", () => {
    it("updates discountPrice", async () => {
      vi.mocked(requirePermission).mockResolvedValue({ authorized: true, session: { user: { id: "admin_1" } } } as any);
      vi.mocked(prisma.dish.findUnique).mockResolvedValue(mockDish as any);
      vi.mocked(prisma.dish.update).mockResolvedValue({ ...mockDish, discountPrice: 120 } as any);

      const formData = new FormData();
      formData.append("name", "Test Dish");
      formData.append("price", "200");
      formData.append("discountPrice", "120");

      const result = await updateDish("dish_1", formData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.dish.discountPrice).toBe(120);
      }
    });
  });

  describe("getDishes returns pricing data", () => {
    it("returns dishes with price and discountPrice", async () => {
      vi.mocked(authorize).mockResolvedValue({ authorized: true, session: null } as any);
      vi.mocked(prisma.dish.findMany).mockResolvedValue([mockDish] as any);

      const result = await getDishes();
      expect(result.dishes).toHaveLength(1);
      expect(result.dishes[0].price).toBe(200);
      expect(result.dishes[0].discountPrice).toBe(150);
    });
  });
});

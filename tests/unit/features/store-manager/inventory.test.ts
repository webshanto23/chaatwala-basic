import { describe, it, expect, vi, beforeEach } from "vitest";
import { getStoreInventory, toggleStoreItemAvailability, getManagedStoreId } from "@/features/store-manager/actions";

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
    dish: {
      findMany: vi.fn(),
    },
    drink: {
      findMany: vi.fn(),
    },
    combo: {
      findMany: vi.fn(),
    },
    storeInventory: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/authorize", () => ({
  authorize: vi.fn(),
}));

vi.mock("@/app/actions/audit", () => ({
  logAction: vi.fn(() => Promise.resolve()),
}));

import { logAction } from "@/app/actions/audit";

vi.mock("next/cache", () => ({
  unstable_cache: vi.fn((fn) => fn()),
  revalidateTag: vi.fn(),
}));

import prisma from "@/lib/prisma";
import { authorize } from "@/lib/authorize";

const mockUserWithStore = {
  id: "user_1",
  managedStore: { id: "store_1" },
};

const mockUserWithoutStore = {
  id: "user_2",
  managedStore: null,
};

const mockDish = {
  id: "dish_1",
  name: "Test Dish",
  price: 200,
  discountPrice: 150,
  isAvailable: true,
  tag: "popular",
  imageUrl: "https://example.com/dish.jpg",
};

const mockDrink = {
  id: "drink_1",
  name: "Test Drink",
  price: 100,
  discountPrice: null,
  isAvailable: true,
  tag: "popular",
  imageUrl: "https://example.com/drink.jpg",
};

const mockCombo = {
  id: "combo_1",
  name: "Test Combo",
  price: 250,
  originalPrice: 300,
  isAvailable: true,
  imageUrl: null,
  items: ["dish_1"],
};

const mockStoreInventory = {
  id: "inv_1",
  storeId: "store_1",
  productType: "dish",
  productId: "dish_1",
  isAvailable: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("store-manager inventory actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getManagedStoreId", () => {
    it("returns storeId when user has managed store", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUserWithStore as any);

      // We can't directly call getManagedStoreId since it's not exported,
      // but we can test it indirectly through getStoreInventory
      vi.mocked(authorize).mockResolvedValue({ authorized: true, session: { user: { id: "user_1" } } } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUserWithStore as any);
      vi.mocked(prisma.dish.findMany).mockResolvedValue([mockDish] as any);
      vi.mocked(prisma.drink.findMany).mockResolvedValue([] as any);
      vi.mocked(prisma.combo.findMany).mockResolvedValue([] as any);
      vi.mocked(prisma.storeInventory.findMany).mockResolvedValue([] as any);

      const result = await getStoreInventory();
      expect(result).toEqual({
        dishes: [expect.objectContaining({ id: "dish_1" })],
        drinks: [],
        combos: [],
      });
    });

    it("returns error when user has no managed store", async () => {
      vi.mocked(authorize).mockResolvedValue({ authorized: true, session: { user: { id: "user_2" } } } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUserWithoutStore as any);

      const result = await getStoreInventory();
      expect(result).toEqual({ error: "No store assigned" });
    });
  });

  describe("getStoreInventory", () => {
    it("returns merged inventory with per-store availability", async () => {
      vi.mocked(authorize).mockResolvedValue({ authorized: true, session: { user: { id: "user_1" } } } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUserWithStore as any);
      vi.mocked(prisma.dish.findMany).mockResolvedValue([mockDish] as any);
      vi.mocked(prisma.drink.findMany).mockResolvedValue([mockDrink] as any);
      vi.mocked(prisma.combo.findMany).mockResolvedValue([mockCombo] as any);
      vi.mocked(prisma.storeInventory.findMany).mockResolvedValue([mockStoreInventory] as any);

      const result = await getStoreInventory();
      expect(result.dishes).toHaveLength(1);
      expect(result.drinks).toHaveLength(1);
      expect(result.combos).toHaveLength(1);
      expect(result.dishes[0].isAvailable).toBe(false);
      expect(result.drinks[0].isAvailable).toBe(true);
    });

    it("falls back to global availability when no StoreInventory entry exists", async () => {
      vi.mocked(authorize).mockResolvedValue({ authorized: true, session: { user: { id: "user_1" } } } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUserWithStore as any);
      vi.mocked(prisma.dish.findMany).mockResolvedValue([{ ...mockDish, isAvailable: true }] as any);
      vi.mocked(prisma.drink.findMany).mockResolvedValue([] as any);
      vi.mocked(prisma.combo.findMany).mockResolvedValue([] as any);
      vi.mocked(prisma.storeInventory.findMany).mockResolvedValue([] as any);

      const result = await getStoreInventory();
      expect(result.dishes[0].isAvailable).toBe(true);
    });

    it("returns Forbidden when not authorized", async () => {
      vi.mocked(authorize).mockResolvedValue({ authorized: false, session: null } as any);

      const result = await getStoreInventory();
      expect(result).toEqual({ error: "Forbidden" });
    });
  });

  describe("toggleStoreItemAvailability", () => {
    it("creates new StoreInventory entry when not exists", async () => {
      vi.mocked(authorize).mockResolvedValue({ authorized: true, session: { user: { id: "user_1" } } } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUserWithStore as any);
      vi.mocked(prisma.storeInventory.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.storeInventory.create).mockResolvedValue(mockStoreInventory as any);
      vi.mocked(logAction).mockResolvedValue(undefined as any);

      const result = await toggleStoreItemAvailability("dish", "dish_1", false);
      expect(result).toEqual({ success: true });
      expect(prisma.storeInventory.create).toHaveBeenCalledWith({
        data: { storeId: "store_1", productType: "dish", productId: "dish_1", isAvailable: false },
      });
    });

    it("updates existing StoreInventory entry", async () => {
      vi.mocked(authorize).mockResolvedValue({ authorized: true, session: { user: { id: "user_1" } } } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUserWithStore as any);
      vi.mocked(prisma.storeInventory.findFirst).mockResolvedValue(mockStoreInventory as any);
      vi.mocked(prisma.storeInventory.update).mockResolvedValue({ ...mockStoreInventory, isAvailable: true } as any);
      vi.mocked(logAction).mockResolvedValue(undefined as any);

      const result = await toggleStoreItemAvailability("dish", "dish_1", true);
      expect(result).toEqual({ success: true });
      expect(prisma.storeInventory.update).toHaveBeenCalledWith({
        where: { id: "inv_1" },
        data: { isAvailable: true, updatedAt: expect.any(Date) },
      });
    });

    it("returns error when not authorized", async () => {
      vi.mocked(authorize).mockResolvedValue({ authorized: false, session: null } as any);

      const result = await toggleStoreItemAvailability("dish", "dish_1", true);
      expect(result).toEqual({ error: "Forbidden" });
    });

    it("returns error when user has no managed store", async () => {
      vi.mocked(authorize).mockResolvedValue({ authorized: true, session: { user: { id: "user_2" } } } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUserWithoutStore as any);

      const result = await toggleStoreItemAvailability("dish", "dish_1", true);
      expect(result).toEqual({ error: "No store assigned" });
    });
  });
});

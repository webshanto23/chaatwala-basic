import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  default: {
    dish: { findMany: vi.fn() },
    drink: { findMany: vi.fn() },
    combo: { findMany: vi.fn() },
    storeInventory: { findMany: vi.fn() },
  },
}));

import prisma from "@/lib/prisma";
import { getUnavailableCartItems } from "@/lib/store-availability";

describe("getUnavailableCartItems", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.drink.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.combo.findMany).mockResolvedValue([] as never);
  });

  it("accepts a globally available item without an inventory override", async () => {
    vi.mocked(prisma.dish.findMany).mockResolvedValue([{ id: "dish_1", storeId: null }] as never);
    vi.mocked(prisma.storeInventory.findMany).mockResolvedValue([] as never);

    await expect(getUnavailableCartItems("store_1", [
      { productId: "dish_1", productType: "dish", name: "Test Dish" },
    ])).resolves.toEqual([]);
  });

  it("rejects a global item disabled by the selected store", async () => {
    vi.mocked(prisma.dish.findMany).mockResolvedValue([{ id: "dish_1", storeId: null }] as never);
    vi.mocked(prisma.storeInventory.findMany).mockResolvedValue([
      { productType: "dish", productId: "dish_1", isAvailable: false },
    ] as never);

    await expect(getUnavailableCartItems("store_1", [
      { productId: "dish_1", productType: "dish", name: "Test Dish" },
    ])).resolves.toEqual([
      { productId: "dish_1", productType: "dish", name: "Test Dish" },
    ]);
  });

  it("rejects an item assigned to another store", async () => {
    vi.mocked(prisma.dish.findMany).mockResolvedValue([{ id: "dish_1", storeId: "store_2" }] as never);
    vi.mocked(prisma.storeInventory.findMany).mockResolvedValue([] as never);

    await expect(getUnavailableCartItems("store_1", [
      { productId: "dish_1", productType: "dish", name: "Test Dish" },
    ])).resolves.toHaveLength(1);
  });
});

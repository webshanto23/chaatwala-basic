import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/cart/validate-store/route";

vi.mock("@/lib/prisma", () => ({
  default: {
    cart: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    cartItem: {
      findMany: vi.fn(),
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
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(() => ({ value: "guest_123" })),
  })),
}));

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

const mockCart = {
  id: "cart_1",
  userId: "user_1",
  guestId: null,
  items: [
    {
      id: "item_1",
      cartId: "cart_1",
      productId: "dish_1",
      productType: "dish",
      name: "Test Dish",
      quantity: 2,
    },
  ],
};

describe("validate-store API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.storeInventory.findMany).mockResolvedValue([] as never);
  });

  it("returns valid when all cart items are available at store", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user_1" },
    } as any);
    vi.mocked(prisma.cart.findFirst).mockResolvedValue(mockCart as any);
    vi.mocked(prisma.dish.findMany).mockResolvedValue([{ id: "dish_1", name: "Test Dish" }] as any);
    vi.mocked(prisma.drink.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.combo.findMany).mockResolvedValue([] as any);

    const request = new Request("http://localhost/api/cart/validate-store", {
      method: "POST",
      body: JSON.stringify({ storeId: "store_1" }),
      headers: { "Content-Type": "application/json" },
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.valid).toBe(true);
    expect(data.unavailableItems).toEqual([]);
  });

  it("returns unavailable items when some products are not available at store", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user_1" },
    } as any);
    vi.mocked(prisma.cart.findFirst).mockResolvedValue(mockCart as any);
    vi.mocked(prisma.dish.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.drink.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.combo.findMany).mockResolvedValue([] as any);

    const request = new Request("http://localhost/api/cart/validate-store", {
      method: "POST",
      body: JSON.stringify({ storeId: "store_1" }),
      headers: { "Content-Type": "application/json" },
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.valid).toBe(false);
    expect(data.unavailableItems).toHaveLength(1);
    expect(data.unavailableItems[0].productId).toBe("dish_1");
  });

  it("returns 400 when storeId is missing", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user_1" },
    } as any);
    vi.mocked(prisma.cart.findFirst).mockResolvedValue(mockCart as any);

    const request = new Request("http://localhost/api/cart/validate-store", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("storeId is required");
  });

  it("returns valid for empty cart", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user_1" },
    } as any);
    vi.mocked(prisma.cart.findFirst).mockResolvedValue({
      ...mockCart,
      items: [],
    } as any);

    const request = new Request("http://localhost/api/cart/validate-store", {
      method: "POST",
      body: JSON.stringify({ storeId: "store_1" }),
      headers: { "Content-Type": "application/json" },
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.valid).toBe(true);
    expect(data.unavailableItems).toEqual([]);
  });

  it("validates guest cart", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    vi.mocked(prisma.cart.findUnique).mockResolvedValue({
      ...mockCart,
      userId: null,
      guestId: "guest_123",
    } as any);
    vi.mocked(prisma.dish.findMany).mockResolvedValue([{ id: "dish_1", name: "Test Dish" }] as any);
    vi.mocked(prisma.drink.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.combo.findMany).mockResolvedValue([] as any);

    const request = new Request("http://localhost/api/cart/validate-store", {
      method: "POST",
      body: JSON.stringify({ storeId: "store_1" }),
      headers: { "Content-Type": "application/json" },
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.valid).toBe(true);
  });
});

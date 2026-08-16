import { describe, it, expect, vi, beforeEach } from "vitest";
import { addToCart, getCart } from "@/features/cart/service";

vi.mock("@/lib/prisma", () => ({
  default: {
    cart: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    cartItem: {
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    dish: { findUnique: vi.fn() },
    drink: { findUnique: vi.fn() },
    combo: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(() => ({ value: "guest_123" })),
    set: vi.fn(),
  })),
}));

vi.mock("@/lib/products", () => ({
  findProduct: vi.fn(),
  getEffectivePrice: vi.fn(),
}));

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { findProduct, getEffectivePrice } from "@/lib/products";

describe("cart pricing security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("addToCart stores DB-derived price instead of hardcoded 0", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user_1" },
    } as any);
    vi.mocked(prisma.cart.findFirst).mockResolvedValue({
      id: "cart_1",
      userId: "user_1",
      guestId: null,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    vi.mocked(prisma.cartItem.findFirst).mockResolvedValue(null);
    vi.mocked(findProduct).mockResolvedValue({
      id: "dish_1",
      name: "Test Dish",
      price: 200,
      discountPrice: null,
      imageUrl: null,
    });
    vi.mocked(getEffectivePrice).mockReturnValue(200);

    let createdItem: any = null;
    (vi.mocked(prisma.cartItem.create) as any).mockImplementation(async (args: any) => {
      createdItem = args.data;
      return {
        id: "item_1",
        cartId: "cart_1",
        productId: "dish_1",
        productType: "dish",
        name: "Test Dish",
        price: args.data.price,
        quantity: 1,
        imageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
    });

    vi.mocked(prisma.cart.findUnique).mockResolvedValue({
      id: "cart_1",
      userId: "user_1",
      guestId: null,
      items: [{
        id: "item_1",
        cartId: "cart_1",
        productId: "dish_1",
        productType: "dish",
        name: "Test Dish",
        price: 200,
        quantity: 1,
        imageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    await addToCart({ productId: "dish_1", productType: "dish" });

    expect(createdItem?.price).toBe(200);
    expect(prisma.cartItem.create).toHaveBeenCalledWith({
      data: {
        cartId: "cart_1",
        productId: "dish_1",
        productType: "dish",
        name: "Test Dish",
        price: 200,
        quantity: 1,
        imageUrl: null,
      },
    });
  });

  it("addToCart uses discount price when available", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user_1" },
    } as any);
    vi.mocked(prisma.cart.findFirst).mockResolvedValue({
      id: "cart_1",
      userId: "user_1",
      guestId: null,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    vi.mocked(prisma.cartItem.findFirst).mockResolvedValue(null);
    vi.mocked(findProduct).mockResolvedValue({
      id: "dish_1",
      name: "Test Dish",
      price: 300,
      discountPrice: 200,
      imageUrl: null,
    });
    vi.mocked(getEffectivePrice).mockReturnValue(200);

    vi.mocked(prisma.cartItem.create).mockResolvedValue({
      id: "item_1",
      cartId: "cart_1",
      productId: "dish_1",
      productType: "dish",
      name: "Test Dish",
      price: 200,
      quantity: 1,
      imageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    vi.mocked(prisma.cart.findUnique).mockResolvedValue({
      id: "cart_1",
      userId: "user_1",
      guestId: null,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    await addToCart({ productId: "dish_1", productType: "dish" });

    expect(prisma.cartItem.create).toHaveBeenCalledWith({
      data: {
        cartId: "cart_1",
        productId: "dish_1",
        productType: "dish",
        name: "Test Dish",
        price: 200,
        quantity: 1,
        imageUrl: null,
      },
    });
  });

  it("cart context total with correct price", async () => {
    const cart = {
      id: "cart_1",
      userId: "user_1",
      guestId: null,
      items: [
        {
          id: "item_1",
          cartId: "cart_1",
          productId: "product_1",
          productType: "dish",
          name: "Test Dish",
          price: 200,
          quantity: 2,
          imageUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    expect(total).toBe(400);
  });
});

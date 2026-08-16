import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCart, addToCart, updateCartItem, removeCartItem } from "@/features/cart/service";

vi.mock("@/lib/prisma", () => ({
  default: {
    cart: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    cartItem: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
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

describe("cart security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getCart creates a new cart for the authenticated user when existing cart belongs to another user", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user_1" },
    } as any);
    vi.mocked(prisma.cart.findFirst).mockResolvedValue({
      id: "cart_user2",
      userId: "user_2",
      guestId: null,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    vi.mocked(prisma.cart.create).mockResolvedValue({
      id: "cart_user1",
      userId: "user_1",
      guestId: null,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const cart = await getCart();
    expect(cart.userId).toBe("user_1");
    expect(cart.id).toBe("cart_user1");
    expect(prisma.cart.create).toHaveBeenCalledWith({
      data: { userId: "user_1" },
      include: { items: true },
    });
  });

  it("addToCart adds item to the correct user's cart with DB-derived price", async () => {
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
      id: "product_1",
      name: "Test Dish",
      price: 200,
      discountPrice: null,
      imageUrl: "https://example.com/dish.jpg",
    });
    vi.mocked(getEffectivePrice).mockReturnValue(200);

    await addToCart({ productId: "product_1", productType: "dish" });

    expect(prisma.cartItem.create).toHaveBeenCalledWith({
      data: {
        cartId: "cart_1",
        productId: "product_1",
        productType: "dish",
        name: "Test Dish",
        price: 200,
        quantity: 1,
        imageUrl: "https://example.com/dish.jpg",
      },
    });
  });

  it("updateCartItem throws for cross-user access", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user_1" },
    } as any);
    vi.mocked(prisma.cartItem.findUnique).mockResolvedValue({
      id: "item_1",
      cartId: "cart_user2",
      productId: "product_1",
      productType: "dish",
      name: "Product",
      price: 200,
      quantity: 1,
      imageUrl: null,
      cart: { id: "cart_user2", userId: "user_2", guestId: null },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    await expect(updateCartItem("item_1", 5)).rejects.toThrow(
      "Unauthorized: item does not belong to this user"
    );
    expect(prisma.cartItem.update).not.toHaveBeenCalled();
  });

  it("updateCartItem succeeds for the item owner", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user_1" },
    } as any);
    vi.mocked(prisma.cartItem.findUnique).mockResolvedValue({
      id: "item_1",
      cartId: "cart_1",
      productId: "product_1",
      productType: "dish",
      name: "Product",
      price: 200,
      quantity: 1,
      imageUrl: null,
      cart: { id: "cart_1", userId: "user_1", guestId: null },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    vi.mocked(prisma.cartItem.update).mockResolvedValue({
      id: "item_1",
      cartId: "cart_1",
      productId: "product_1",
      productType: "dish",
      name: "Product",
      price: 200,
      quantity: 5,
      imageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    vi.mocked(prisma.cart.findFirst).mockResolvedValue({
      id: "cart_1",
      userId: "user_1",
      guestId: null,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const result = await updateCartItem("item_1", 5);
    expect(result.items).toBeDefined();
    expect(prisma.cartItem.update).toHaveBeenCalledWith({
      where: { id: "item_1" },
      data: { quantity: 5 },
    });
  });

  it("removeCartItem throws for cross-user access", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user_1" },
    } as any);
    vi.mocked(prisma.cartItem.findUnique).mockResolvedValue({
      id: "item_1",
      cartId: "cart_user2",
      productId: "product_1",
      productType: "dish",
      name: "Product",
      price: 200,
      quantity: 1,
      imageUrl: null,
      cart: { id: "cart_user2", userId: "user_2", guestId: null },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    await expect(removeCartItem("item_1")).rejects.toThrow(
      "Unauthorized: item does not belong to this user"
    );
    expect(prisma.cartItem.delete).not.toHaveBeenCalled();
  });

  it("removeCartItem succeeds for the item owner", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user_1" },
    } as any);
    vi.mocked(prisma.cartItem.findUnique).mockResolvedValue({
      id: "item_1",
      cartId: "cart_1",
      productId: "product_1",
      productType: "dish",
      name: "Product",
      price: 200,
      quantity: 1,
      imageUrl: null,
      cart: { id: "cart_1", userId: "user_1", guestId: null },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    vi.mocked(prisma.cartItem.delete).mockResolvedValue({
      id: "item_1",
      cartId: "cart_1",
      productId: "product_1",
      productType: "dish",
      name: "Product",
      price: 200,
      quantity: 1,
      imageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    vi.mocked(prisma.cart.findFirst).mockResolvedValue({
      id: "cart_1",
      userId: "user_1",
      guestId: null,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    await removeCartItem("item_1");
    expect(prisma.cartItem.delete).toHaveBeenCalledWith({ where: { id: "item_1" } });
  });
});

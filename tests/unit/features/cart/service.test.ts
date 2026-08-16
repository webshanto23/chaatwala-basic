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

const mockCartItem = {
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
};

describe("cart service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCart", () => {
    it("returns existing cart for authenticated user", async () => {
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

      const cart = await getCart();
      expect(cart.id).toBe("cart_1");
      expect(prisma.cart.findFirst).toHaveBeenCalledWith({
        where: { userId: "user_1" },
        include: { items: { orderBy: { createdAt: "desc" } } },
      });
    });

    it("creates new cart for authenticated user without one", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user_1" },
      } as any);
      vi.mocked(prisma.cart.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.cart.create).mockResolvedValue({
        id: "cart_new",
        userId: "user_1",
        guestId: null,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const cart = await getCart();
      expect(cart.id).toBe("cart_new");
      expect(prisma.cart.create).toHaveBeenCalledWith({
        data: { userId: "user_1" },
        include: { items: true },
      });
    });

    it("returns existing guest cart", async () => {
      vi.mocked(auth).mockResolvedValue(null);
      vi.mocked(prisma.cart.findUnique).mockResolvedValue({
        id: "cart_guest",
        userId: null,
        guestId: "guest_123",
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const cart = await getCart();
      expect(cart.id).toBe("cart_guest");
    });

    it("creates new guest cart when none exists", async () => {
      vi.mocked(auth).mockResolvedValue(null);
      vi.mocked(prisma.cart.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.cart.create).mockResolvedValue({
        id: "cart_new_guest",
        userId: null,
        guestId: "guest_123",
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const cart = await getCart();
      expect(cart.id).toBe("cart_new_guest");
    });
  });

  describe("addToCart", () => {
    it("adds new item when product not in cart with DB-derived price", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user_1" },
      } as any);
      vi.mocked(prisma.cart.findFirst)
        .mockResolvedValueOnce({
          id: "cart_1",
          userId: "user_1",
          guestId: null,
          items: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any)
        .mockResolvedValueOnce({
          id: "cart_1",
          userId: "user_1",
          guestId: null,
          items: [{ ...mockCartItem, price: 200 }],
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);
      vi.mocked(findProduct).mockResolvedValue({
        id: "product_1",
        name: "Product",
        price: 200,
        discountPrice: null,
        imageUrl: null,
      });
      vi.mocked(getEffectivePrice).mockReturnValue(200);
      vi.mocked(prisma.cartItem.create).mockResolvedValue(mockCartItem as any);

      const result = await addToCart({ productId: "product_1", productType: "dish" });
      expect(result.items).toHaveLength(1);
      expect(prisma.cartItem.create).toHaveBeenCalledWith({
        data: {
          cartId: "cart_1",
          productId: "product_1",
          productType: "dish",
          name: "Product",
          price: 200,
          quantity: 1,
          imageUrl: null,
        },
      });
    });

    it("increments quantity when product already in cart", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user_1" },
      } as any);
      const existingItem = { ...mockCartItem, quantity: 2 };
      vi.mocked(prisma.cart.findFirst)
        .mockResolvedValueOnce({
          id: "cart_1",
          userId: "user_1",
          guestId: null,
          items: [existingItem],
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any)
        .mockResolvedValueOnce({
          id: "cart_1",
          userId: "user_1",
          guestId: null,
          items: [{ ...existingItem, quantity: 3 }],
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);
      vi.mocked(prisma.cartItem.update).mockResolvedValue({ ...existingItem, quantity: 3 } as any);

      const result = await addToCart({ productId: "product_1", productType: "dish", quantity: 1 });
      expect(result.items[0].quantity).toBe(3);
      expect(prisma.cartItem.update).toHaveBeenCalledWith({
        where: { id: "item_1" },
        data: { quantity: 3 },
      });
    });
  });

  describe("updateCartItem", () => {
    it("updates quantity when > 0", async () => {
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
        ...mockCartItem,
        quantity: 5,
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

    it("deletes item when quantity <= 0", async () => {
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
        ...mockCartItem,
        quantity: 1,
      } as any);
      vi.mocked(prisma.cart.findFirst).mockResolvedValue({
        id: "cart_1",
        userId: "user_1",
        guestId: null,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await updateCartItem("item_1", 0);
      expect(prisma.cartItem.delete).toHaveBeenCalledWith({ where: { id: "item_1" } });
    });
  });

  describe("removeCartItem", () => {
    it("deletes the cart item", async () => {
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
        ...mockCartItem,
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
});

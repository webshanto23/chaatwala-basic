import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/cart/route";
import { POST } from "@/app/api/cart/route";
import { DELETE } from "@/app/api/cart/route";

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
      deleteMany: vi.fn(),
    },
    dish: { findUnique: vi.fn() },
    drink: { findUnique: vi.fn() },
    combo: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(() => ({ success: true })),
  getClientIp: vi.fn(() => "127.0.0.1"),
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
  revalidateTag: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(() => ({ value: "guest_123" })),
    set: vi.fn(),
  })),
}));

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

const mockCart = {
  id: "cart_1",
  userId: "user_1",
  guestId: null,
  items: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

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

describe("Cart API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns cart for authenticated user", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user_1" },
      } as any);
      vi.mocked(prisma.cart.findFirst).mockResolvedValue({
        ...mockCart,
        items: [mockCartItem],
      } as any);

      const request = new Request("http://localhost/api/cart");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cart.id).toBe("cart_1");
      expect(data.cart.items).toHaveLength(1);
    });

    it("returns cart for guest user", async () => {
      vi.mocked(auth).mockResolvedValue(null);
      vi.mocked(prisma.cart.findUnique).mockResolvedValue({
        ...mockCart,
        userId: null,
        guestId: "guest_123",
        items: [],
      } as any);

      const request = new Request("http://localhost/api/cart");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cart.guestId).toBe("guest_123");
    });
  });

  describe("POST", () => {
    it("adds item to cart with valid product", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user_1" },
      } as any);
      vi.mocked(prisma.cart.findFirst).mockResolvedValue({
        ...mockCart,
        items: [],
      } as any);
      vi.mocked(prisma.cartItem.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.dish.findUnique).mockResolvedValue({
        id: "product_1",
        name: "Test Dish",
        price: 200,
        imageUrl: "https://example.com/dish.jpg",
      } as any);
      vi.mocked(prisma.cartItem.create).mockResolvedValue(mockCartItem as any);
      vi.mocked(prisma.cart.findUnique).mockResolvedValue({
        ...mockCart,
        items: [mockCartItem],
      } as any);

      const request = new Request("http://localhost/api/cart", {
        method: "POST",
        body: JSON.stringify({ productId: "product_1", productType: "dish" }),
        headers: { "Content-Type": "application/json" },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cart.items).toHaveLength(1);
      expect(prisma.cartItem.create).toHaveBeenCalled();
    });

    it("returns 400 when productId is missing", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user_1" },
      } as any);

      const request = new Request("http://localhost/api/cart", {
        method: "POST",
        body: JSON.stringify({ productType: "dish" }),
        headers: { "Content-Type": "application/json" },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("productId and productType are required");
    });

    it("returns 400 when productType is invalid", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user_1" },
      } as any);

      const request = new Request("http://localhost/api/cart", {
        method: "POST",
        body: JSON.stringify({ productId: "product_1", productType: "invalid" }),
        headers: { "Content-Type": "application/json" },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid productType");
    });

    it("returns 404 when product not found", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user_1" },
      } as any);
      vi.mocked(prisma.cart.findFirst).mockResolvedValue({
        ...mockCart,
        items: [],
      } as any);
      vi.mocked(prisma.dish.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.drink.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.combo.findUnique).mockResolvedValue(null);

      const request = new Request("http://localhost/api/cart", {
        method: "POST",
        body: JSON.stringify({ productId: "nonexistent", productType: "dish" }),
        headers: { "Content-Type": "application/json" },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Product not found");
    });

    it("returns 429 when rate limit exceeded", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user_1" },
      } as any);
      const { checkRateLimit } = await import("@/lib/rate-limit");
      vi.mocked(checkRateLimit).mockResolvedValueOnce({ success: false });

      const request = new Request("http://localhost/api/cart", {
        method: "POST",
        body: JSON.stringify({ productId: "product_1", productType: "dish" }),
        headers: { "Content-Type": "application/json" },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe("Too many requests");
    });
  });

  describe("DELETE", () => {
    it("clears cart items", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user_1" },
      } as any);
      vi.mocked(prisma.cart.findFirst).mockResolvedValue({
        ...mockCart,
        items: [mockCartItem],
      } as any);
      vi.mocked(prisma.cartItem.deleteMany).mockResolvedValue({ count: 1 } as any);
      vi.mocked(prisma.cart.findUnique).mockResolvedValue({
        ...mockCart,
        items: [],
      } as any);

      const request = new Request("http://localhost/api/cart", {
        method: "DELETE",
      });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cart.items).toHaveLength(0);
      expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({ where: { cartId: "cart_1" } });
    });
  });
});

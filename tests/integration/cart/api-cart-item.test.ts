import { describe, it, expect, vi, beforeEach } from "vitest";
import { PATCH } from "@/app/api/cart/item/[id]/route";
import { DELETE } from "@/app/api/cart/item/[id]/route";

vi.mock("@/lib/prisma", () => ({
  default: {
    cartItem: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    cart: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(() => ({ success: true })),
  getClientIp: vi.fn(() => "127.0.0.1"),
}));

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

import prisma from "@/lib/prisma";

const mockCartItem = {
  id: "item_1",
  cartId: "cart_1",
  productId: "product_1",
  productType: "dish",
  name: "Product",
  price: 200,
  quantity: 2,
  imageUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockCart = {
  id: "cart_1",
  userId: "user_1",
  guestId: null,
  items: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("Cart Item API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("PATCH", () => {
    it("updates quantity for valid item", async () => {
      vi.mocked(prisma.cartItem.findUnique).mockResolvedValue(mockCartItem as any);
      vi.mocked(prisma.cartItem.update).mockResolvedValue({
        ...mockCartItem,
        quantity: 5,
      } as any);

      const request = new Request("http://localhost/api/cart/item/item_1", {
        method: "PATCH",
        body: JSON.stringify({ quantity: 5 }),
        headers: { "Content-Type": "application/json" },
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: "item_1" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.item.quantity).toBe(5);
      expect(prisma.cartItem.update).toHaveBeenCalledWith({
        where: { id: "item_1" },
        data: { quantity: 5 },
      });
    });

    it("returns 400 for quantity less than 1", async () => {
      const request = new Request("http://localhost/api/cart/item/item_1", {
        method: "PATCH",
        body: JSON.stringify({ quantity: 0 }),
        headers: { "Content-Type": "application/json" },
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: "item_1" }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Quantity must be at least 1");
    });

    it("returns 404 for nonexistent item", async () => {
      vi.mocked(prisma.cartItem.findUnique).mockResolvedValue(null);

      const request = new Request("http://localhost/api/cart/item/nonexistent", {
        method: "PATCH",
        body: JSON.stringify({ quantity: 5 }),
        headers: { "Content-Type": "application/json" },
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: "nonexistent" }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Cart item not found");
    });

    it("returns 429 when rate limit exceeded", async () => {
      const { checkRateLimit } = await import("@/lib/rate-limit");
      vi.mocked(checkRateLimit).mockResolvedValueOnce({ success: false });

      const request = new Request("http://localhost/api/cart/item/item_1", {
        method: "PATCH",
        body: JSON.stringify({ quantity: 5 }),
        headers: { "Content-Type": "application/json" },
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: "item_1" }) });
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe("Too many requests");
    });
  });

  describe("DELETE", () => {
    it("deletes cart item and returns updated cart", async () => {
      vi.mocked(prisma.cartItem.findUnique).mockResolvedValue(mockCartItem as any);
      vi.mocked(prisma.cartItem.delete).mockResolvedValue(mockCartItem as any);
      vi.mocked(prisma.cart.findUnique).mockResolvedValue({
        ...mockCart,
        items: [],
      } as any);

      const request = new Request("http://localhost/api/cart/item/item_1", {
        method: "DELETE",
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: "item_1" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cart.items).toHaveLength(0);
      expect(prisma.cartItem.delete).toHaveBeenCalledWith({ where: { id: "item_1" } });
    });

    it("returns 404 for nonexistent item", async () => {
      vi.mocked(prisma.cartItem.findUnique).mockResolvedValue(null);

      const request = new Request("http://localhost/api/cart/item/nonexistent", {
        method: "DELETE",
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: "nonexistent" }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Cart item not found");
    });

    it("returns 429 when rate limit exceeded", async () => {
      const { checkRateLimit } = await import("@/lib/rate-limit");
      vi.mocked(checkRateLimit).mockResolvedValueOnce({ success: false });

      const request = new Request("http://localhost/api/cart/item/item_1", {
        method: "DELETE",
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: "item_1" }) });
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe("Too many requests");
    });
  });
});

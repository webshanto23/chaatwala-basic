import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/orders/route";

vi.mock("@/lib/prisma", () => ({
  default: {
    cart: {
      findFirst: vi.fn(),
    },
    cartItem: {
      deleteMany: vi.fn(),
    },
    store: {
      findUnique: vi.fn(),
    },
    address: {
      findFirst: vi.fn(),
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
    order: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(() => ({ success: true })),
  getClientIp: vi.fn(() => "127.0.0.1"),
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

const mockAddress = {
  id: "address_1",
  userId: "user_1",
  fullName: "Test User",
  phone: "01700000000",
  line1: "123 Test Street",
  line2: null,
  city: "Dhaka",
  postalCode: "1230",
  country: "BD",
  isDefault: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockOrder = {
  id: "order_1",
  userId: "user_1",
  addressId: "address_1",
  status: "pending_payment",
  subtotal: 400,
  deliveryFee: 50,
  total: 450,
  idempotencyKey: null,
  paymentStatus: "pending",
  sslTxnId: null,
  sslAmount: null,
  sslHash: null,
  paymentMethod: null,
  items: [
    {
      id: "order_item_1",
      orderId: "order_1",
      productId: "dish_1",
      productType: "dish",
      name: "Test Dish",
      price: 200,
      quantity: 2,
      imageUrl: null,
      createdAt: new Date(),
    },
  ],
  address: mockAddress,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("Orders API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.storeInventory.findMany).mockResolvedValue([] as never);
  });

  describe("POST /api/orders", () => {
    it("creates order with valid cart, store, and address", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user_1" },
      } as any);
      vi.mocked(prisma.cart.findFirst).mockResolvedValue(mockCart as any);
      vi.mocked(prisma.store.findUnique).mockResolvedValue({ id: "store_1" } as any);
      vi.mocked(prisma.address.findFirst).mockResolvedValue(mockAddress as any);
      vi.mocked(prisma.dish.findMany).mockResolvedValue([{ id: "dish_1" }] as any);
      vi.mocked(prisma.drink.findMany).mockResolvedValue([] as any);
      vi.mocked(prisma.combo.findMany).mockResolvedValue([] as any);
      vi.mocked(prisma.order.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.order.create).mockResolvedValue(mockOrder as any);
      vi.mocked(prisma.cartItem.deleteMany).mockResolvedValue({ count: 1 } as any);

      const request = new Request("http://localhost/api/orders", {
        method: "POST",
        body: JSON.stringify({ addressId: "address_1", storeId: "store_1" }),
        headers: { "Content-Type": "application/json" },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.order.id).toBe("order_1");
      expect(data.order.total).toBe(450);
      expect(data.order.items).toHaveLength(1);
      expect(prisma.order.create).toHaveBeenCalledWith({
        data: {
          userId: "user_1",
          addressId: "address_1",
          subtotal: 400,
          deliveryFee: 50,
          total: 450,
          idempotencyKey: undefined,
          items: {
            create: [
              {
                productId: "dish_1",
                productType: "dish",
                name: "Test Dish",
                price: 200,
                quantity: 2,
                imageUrl: null,
              },
            ],
          },
        },
        include: {
          items: true,
          address: true,
        },
      });
    });

    it("returns 401 when user is not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const request = new Request("http://localhost/api/orders", {
        method: "POST",
        body: JSON.stringify({ addressId: "address_1", storeId: "store_1" }),
        headers: { "Content-Type": "application/json" },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Please sign in to checkout");
    });

    it("returns 400 when addressId is missing", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user_1" },
      } as any);

      const request = new Request("http://localhost/api/orders", {
        method: "POST",
        body: JSON.stringify({ storeId: "store_1" }),
        headers: { "Content-Type": "application/json" },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("addressId is required");
    });

    it("returns 400 when storeId is missing", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user_1" },
      } as any);

      const request = new Request("http://localhost/api/orders", {
        method: "POST",
        body: JSON.stringify({ addressId: "address_1" }),
        headers: { "Content-Type": "application/json" },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("storeId is required");
    });

    it("returns 400 when cart is empty", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user_1" },
      } as any);
      vi.mocked(prisma.cart.findFirst).mockResolvedValue({
        ...mockCart,
        items: [],
      } as any);

      const request = new Request("http://localhost/api/orders", {
        method: "POST",
        body: JSON.stringify({ addressId: "address_1", storeId: "store_1" }),
        headers: { "Content-Type": "application/json" },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Cart is empty");
    });

    it("returns 404 when store is not found", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user_1" },
      } as any);
      vi.mocked(prisma.cart.findFirst).mockResolvedValue(mockCart as any);
      vi.mocked(prisma.store.findUnique).mockResolvedValue(null);

      const request = new Request("http://localhost/api/orders", {
        method: "POST",
        body: JSON.stringify({ addressId: "address_1", storeId: "nonexistent" }),
        headers: { "Content-Type": "application/json" },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Store not found");
    });

    it("returns 404 when address is not found", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user_1" },
      } as any);
      vi.mocked(prisma.cart.findFirst).mockResolvedValue(mockCart as any);
      vi.mocked(prisma.store.findUnique).mockResolvedValue({ id: "store_1" } as any);
      vi.mocked(prisma.address.findFirst).mockResolvedValue(null);

      const request = new Request("http://localhost/api/orders", {
        method: "POST",
        body: JSON.stringify({ addressId: "nonexistent", storeId: "store_1" }),
        headers: { "Content-Type": "application/json" },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Address not found");
    });

    it("returns 404 when address belongs to another user", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user_1" },
      } as any);
      vi.mocked(prisma.cart.findFirst).mockResolvedValue(mockCart as any);
      vi.mocked(prisma.store.findUnique).mockResolvedValue({ id: "store_1" } as any);
      vi.mocked(prisma.address.findFirst).mockResolvedValue(null);

      const request = new Request("http://localhost/api/orders", {
        method: "POST",
        body: JSON.stringify({ addressId: "address_user2", storeId: "store_1" }),
        headers: { "Content-Type": "application/json" },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Address not found");
    });

    it("returns 409 when cart items are unavailable at store", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user_1" },
      } as any);
      vi.mocked(prisma.cart.findFirst).mockResolvedValue(mockCart as any);
      vi.mocked(prisma.store.findUnique).mockResolvedValue({ id: "store_1" } as any);
      vi.mocked(prisma.address.findFirst).mockResolvedValue(mockAddress as any);
      vi.mocked(prisma.dish.findMany).mockResolvedValue([] as any);
      vi.mocked(prisma.drink.findMany).mockResolvedValue([] as any);
      vi.mocked(prisma.combo.findMany).mockResolvedValue([] as any);

      const request = new Request("http://localhost/api/orders", {
        method: "POST",
        body: JSON.stringify({ addressId: "address_1", storeId: "store_1" }),
        headers: { "Content-Type": "application/json" },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toContain("Out of stock");
      expect(data.unavailableItems).toContain("Test Dish");
    });

    it("returns existing order when idempotencyKey matches", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user_1" },
      } as any);
      vi.mocked(prisma.cart.findFirst).mockResolvedValue(mockCart as any);
      vi.mocked(prisma.store.findUnique).mockResolvedValue({ id: "store_1" } as any);
      vi.mocked(prisma.address.findFirst).mockResolvedValue(mockAddress as any);
      vi.mocked(prisma.dish.findMany).mockResolvedValue([{ id: "dish_1" }] as any);
      vi.mocked(prisma.drink.findMany).mockResolvedValue([] as any);
      vi.mocked(prisma.combo.findMany).mockResolvedValue([] as any);
      vi.mocked(prisma.order.findFirst).mockResolvedValue(mockOrder as any);

      const request = new Request("http://localhost/api/orders", {
        method: "POST",
        body: JSON.stringify({ addressId: "address_1", storeId: "store_1" }),
        headers: {
          "Content-Type": "application/json",
          "idempotency-key": "key_123",
        },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.order.id).toBe("order_1");
      expect(prisma.order.create).not.toHaveBeenCalled();
    });

    it("returns 429 when rate limit exceeded", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user_1" },
      } as any);
      const { checkRateLimit } = await import("@/lib/rate-limit");
      vi.mocked(checkRateLimit).mockResolvedValueOnce({ success: false });

      const request = new Request("http://localhost/api/orders", {
        method: "POST",
        body: JSON.stringify({ addressId: "address_1", storeId: "store_1" }),
        headers: { "Content-Type": "application/json" },
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe("Too many requests. Please try again later.");
    });
  });
});

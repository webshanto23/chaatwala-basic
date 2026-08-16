import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/payment/initiate/route";

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
    dish: {
      findMany: vi.fn(),
    },
    drink: {
      findMany: vi.fn(),
    },
    combo: {
      findMany: vi.fn(),
    },
    order: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
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

vi.mock("@/lib/sslcommerz", () => ({
  initiatePayment: vi.fn(() => Promise.resolve({
    GatewayPageURL: "https://sandbox.sslcommerz.com/gwprocess/v4/test.php",
    sessionkey: "test-session-key",
  })),
}));

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(() => ({ value: "guest_123" })),
  })),
}));

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { initiatePayment } from "@/lib/sslcommerz";

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

const mockOrder = {
  id: "order_1",
  userId: "user_1",
  addressId: null,
  storeId: "store_1",
  status: "pending_payment",
  subtotal: 400,
  deliveryFee: 50,
  total: 450,
  idempotencyKey: "key_123",
  paymentStatus: "pending",
  sslTxnId: "txn_123",
  sslAmount: 450,
  sslHash: null,
  paymentMethod: null,
  items: [],
  address: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("Payment Initiate API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initiates payment with valid cart, store, and body", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user_1", name: "Test User", email: "test@example.com" },
    } as any);
    vi.mocked(prisma.cart.findFirst).mockResolvedValue(mockCart as any);
    vi.mocked(prisma.store.findUnique).mockResolvedValue({ id: "store_1" } as any);
    vi.mocked(prisma.dish.findMany).mockResolvedValue([{ id: "dish_1", name: "Test Dish" }] as any);
    vi.mocked(prisma.drink.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.combo.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.order.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.order.create).mockResolvedValue(mockOrder as any);
    vi.mocked(prisma.cartItem.deleteMany).mockResolvedValue({ count: 1 } as any);

    const request = new Request("http://localhost/api/payment/initiate", {
      method: "POST",
      body: JSON.stringify({
        storeId: "store_1",
        shippingAddress: {
          fullName: "Test User",
          line1: "123 Test Street",
          city: "Dhaka",
          postalCode: "1230",
          country: "BD",
        },
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.gatewayUrl).toBe("https://sandbox.sslcommerz.com/gwprocess/v4/test.php");
    expect(data.tranId).toMatch(/^txn_/);
    expect(data.orderId).toBe("order_1");
    expect(initiatePayment).toHaveBeenCalledWith(
      expect.objectContaining({
        tran_id: expect.stringMatching(/^txn_/),
        total_amount: 450,
        currency: "BDT",
        cus_name: "Test User",
        cus_email: "test@example.com",
      })
    );
  });

  it("returns 400 when storeId is missing", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user_1" },
    } as any);
    vi.mocked(prisma.cart.findFirst).mockResolvedValue(mockCart as any);

    const request = new Request("http://localhost/api/payment/initiate", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("storeId is required");
  });

  it("returns 404 when store is not found", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user_1" },
    } as any);
    vi.mocked(prisma.cart.findFirst).mockResolvedValue(mockCart as any);
    vi.mocked(prisma.store.findUnique).mockResolvedValue(null);

    const request = new Request("http://localhost/api/payment/initiate", {
      method: "POST",
      body: JSON.stringify({ storeId: "nonexistent" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Store not found");
  });

  it("returns 409 when cart items are unavailable at store", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user_1" },
    } as any);
    vi.mocked(prisma.cart.findFirst).mockResolvedValue(mockCart as any);
    vi.mocked(prisma.store.findUnique).mockResolvedValue({ id: "store_1" } as any);
    vi.mocked(prisma.dish.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.drink.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.combo.findMany).mockResolvedValue([] as any);

    const request = new Request("http://localhost/api/payment/initiate", {
      method: "POST",
      body: JSON.stringify({ storeId: "store_1" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toContain("Out of stock");
  });

  it("P0 BUG FIX: request body is parsed once (request.json() called once)", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const sourcePath = path.join(process.cwd(), "src/app/api/payment/initiate/route.ts");
    const sourceCode = fs.readFileSync(sourcePath, "utf-8");
    const matches = sourceCode.match(/await request\.json\(\)/g);
    expect(matches?.length).toBe(1);
  });

  it("returns existing order when idempotency key matches", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user_1", name: "Test User", email: "test@example.com" },
    } as any);
    vi.mocked(prisma.cart.findFirst).mockResolvedValue(mockCart as any);
    vi.mocked(prisma.store.findUnique).mockResolvedValue({ id: "store_1" } as any);
    vi.mocked(prisma.dish.findMany).mockResolvedValue([{ id: "dish_1", name: "Test Dish" }] as any);
    vi.mocked(prisma.drink.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.combo.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.order.findFirst).mockResolvedValue(mockOrder as any);

    const request = new Request("http://localhost/api/payment/initiate", {
      method: "POST",
      body: JSON.stringify({ storeId: "store_1" }),
      headers: {
        "Content-Type": "application/json",
        "idempotency-key": "key_123",
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.orderId).toBe("order_1");
    expect(data.message).toBe("Order already exists");
    expect(prisma.order.create).not.toHaveBeenCalled();
  });

  it("returns 500 when payment initiation fails", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user_1", name: "Test User", email: "test@example.com" },
    } as any);
    vi.mocked(prisma.cart.findFirst).mockResolvedValue(mockCart as any);
    vi.mocked(prisma.store.findUnique).mockResolvedValue({ id: "store_1" } as any);
    vi.mocked(prisma.dish.findMany).mockResolvedValue([{ id: "dish_1", name: "Test Dish" }] as any);
    vi.mocked(prisma.drink.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.combo.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.order.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.order.create).mockResolvedValue(mockOrder as any);
    vi.mocked(prisma.cartItem.deleteMany).mockResolvedValue({ count: 1 } as any);
    vi.mocked(initiatePayment).mockRejectedValueOnce(new Error("Gateway timeout"));

    const request = new Request("http://localhost/api/payment/initiate", {
      method: "POST",
      body: JSON.stringify({ storeId: "store_1" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain("Payment initiation failed");
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: "order_1" },
      data: {
        status: "payment_failed",
        paymentStatus: "failed",
      },
    });
  });

  it("returns 429 when rate limit exceeded", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user_1" },
    } as any);
    const { checkRateLimit } = await import("@/lib/rate-limit");
    vi.mocked(checkRateLimit).mockResolvedValueOnce({ success: false });

    const request = new Request("http://localhost/api/payment/initiate", {
      method: "POST",
      body: JSON.stringify({ storeId: "store_1" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toBe("Too many requests. Please try again later.");
  });
});

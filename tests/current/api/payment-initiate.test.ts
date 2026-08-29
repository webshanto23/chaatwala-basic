import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), rate: vi.fn(), ip: vi.fn(), unavailable: vi.fn(), calculatedFood: vi.fn(), initiatePayment: vi.fn(),
  prisma: { store: { findFirst: vi.fn() }, address: { findFirst: vi.fn() }, cart: { findFirst: vi.fn() }, order: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() }, paymentAttempt: { create: vi.fn(), update: vi.fn() }, $transaction: vi.fn() },
}));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: mocks.rate, getClientIp: mocks.ip }));
vi.mock("@/lib/store-availability", () => ({ getUnavailableCartItems: mocks.unavailable }));
vi.mock("@/features/food/service", () => ({ getCalculatedFood: mocks.calculatedFood }));
vi.mock("@/lib/sslcommerz", () => ({ initiatePayment: mocks.initiatePayment }));
vi.mock("@/lib/prisma", () => ({ default: mocks.prisma }));

import { POST } from "@/app/api/payment/initiate/route";

const request = () => new Request("http://localhost/api/payment/initiate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ storeId: "store_1", addressId: "address_1" }) });

describe("payment initiation", () => {
  const oldUrl = process.env.PAYMENT_PUBLIC_URL;
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PAYMENT_PUBLIC_URL = "https://checkout.trycloudflare.com";
    mocks.auth.mockResolvedValue({ user: { id: "customer_1", workspace: "customer", name: "Customer", email: "customer@example.com" } });
    mocks.rate.mockResolvedValue({ success: true }); mocks.ip.mockReturnValue("127.0.0.1");
    mocks.prisma.store.findFirst.mockResolvedValue({ id: "store_1" });
    mocks.prisma.address.findFirst.mockResolvedValue({ id: "address_1", fullName: "Customer", phone: "01700000000", line1: "Road", city: "Dhaka", postalCode: "1200", country: "BD" });
    mocks.prisma.cart.findFirst.mockResolvedValue({ id: "cart_1", items: [{ productId: "food_1", productType: "food", name: "Fuchka", price: 100, quantity: 2, imageUrl: null }] });
    mocks.unavailable.mockResolvedValue([]); mocks.calculatedFood.mockResolvedValue({ isAvailable: true, finalPrice: 100 });
    mocks.prisma.order.create.mockResolvedValue({ id: "order_1", total: 250, items: [{ productId: "food_1", productType: "food", name: "Fuchka", price: 100, quantity: 2 }] });
    mocks.prisma.paymentAttempt.create.mockResolvedValue({ id: "attempt_1", transactionId: "txn_1" });
    mocks.prisma.order.update.mockResolvedValue({});
    mocks.prisma.$transaction.mockImplementation(async (callback: (tx: typeof mocks.prisma) => unknown) => callback(mocks.prisma));
    mocks.initiatePayment.mockResolvedValue({ GatewayPageURL: "https://sandbox.sslcommerz.com/pay" });
  });
  afterEach(() => { process.env.PAYMENT_PUBLIC_URL = oldUrl; });

  it("allows only customers to create a pending order and gateway attempt", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "staff_1", workspace: "staff" } });
    expect((await POST(request())).status).toBe(401);
    expect(mocks.prisma.order.create).not.toHaveBeenCalled();
  });

  it("uses trusted cart data, preserves the cart, and sends public callbacks", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(mocks.prisma.order.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ userId: "customer_1", paymentStatus: "pending", total: 250 }) }));
    expect(mocks.initiatePayment).toHaveBeenCalledWith(expect.objectContaining({ success_url: "https://checkout.trycloudflare.com/checkout/success", ipn_url: "https://checkout.trycloudflare.com/api/payment/validate" }));
    expect(mocks.prisma.cart.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: "customer_1" } }));
  });

  it("records a failed attempt but returns the pending order for retry", async () => {
    mocks.initiatePayment.mockRejectedValue(new Error("gateway unavailable"));
    const response = await POST(request());
    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ orderId: "order_1" });
    expect(mocks.prisma.paymentAttempt.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "FAILED" }) }));
  });
});

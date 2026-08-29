import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  validatePayment: vi.fn(), rate: vi.fn(), revalidate: vi.fn(),
  prisma: { paymentAttempt: { findUnique: vi.fn(), update: vi.fn() }, order: { update: vi.fn() }, cart: { findFirst: vi.fn() }, orderItem: { findMany: vi.fn() }, $transaction: vi.fn() },
}));
vi.mock("@/lib/sslcommerz", () => ({ validatePayment: mocks.validatePayment }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: mocks.rate }));
vi.mock("next/cache", () => ({ revalidateTag: mocks.revalidate }));
vi.mock("@/lib/prisma", () => ({ default: mocks.prisma }));

import { POST } from "@/app/api/payment/validate/route";

describe("payment validation", () => {
  beforeEach(() => {
    vi.clearAllMocks(); mocks.rate.mockResolvedValue({ success: true });
    mocks.prisma.paymentAttempt.findUnique.mockResolvedValue({ id: "attempt_1", transactionId: "txn_1", amount: 250, status: "PENDING", orderId: "order_1", order: { paymentStatus: "pending", userId: "customer_1" } });
    mocks.prisma.paymentAttempt.update.mockResolvedValue({}); mocks.prisma.order.update.mockResolvedValue({});
    mocks.prisma.$transaction.mockImplementation((queries: Promise<unknown>[]) => Promise.all(queries));
    mocks.prisma.cart.findFirst.mockResolvedValue(null); mocks.prisma.orderItem.findMany.mockResolvedValue([]);
  });

  it("rejects an SSLCommerz amount mismatch without marking the order paid", async () => {
    mocks.validatePayment.mockResolvedValue({ tran_id: "txn_1", amount: "1", status: "VALID" });
    const response = await POST(new Request("http://localhost/api/payment/validate", { method: "POST", body: "val_id=val_1" }));
    expect(response.status).toBe(400);
    expect(mocks.prisma.paymentAttempt.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "FAILED", failureReason: "Amount mismatch" }) }));
    expect(mocks.prisma.order.update).not.toHaveBeenCalled();
  });

  it("marks only a validated attempt and order as paid, then clears matching cart quantities", async () => {
    mocks.validatePayment.mockResolvedValue({ tran_id: "txn_1", amount: "250", status: "VALID" });
    const response = await POST(new Request("http://localhost/api/payment/validate", { method: "POST", body: "val_id=val_1" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: "VALID", orderId: "order_1" });
    expect(mocks.prisma.order.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ paymentStatus: "paid" }) }));
    expect(mocks.revalidate).toHaveBeenCalledWith("orders", "default");
  });
});

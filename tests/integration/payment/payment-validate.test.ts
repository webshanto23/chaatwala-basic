import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/payment/validate/route";
import { GET } from "@/app/api/payment/validate/route";

vi.mock("@/lib/prisma", () => ({
  default: {
    order: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/sslcommerz", () => ({
  validatePayment: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(() => ({ success: true })),
  getClientIp: vi.fn(() => "127.0.0.1"),
}));

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

import prisma from "@/lib/prisma";
import { validatePayment } from "@/lib/sslcommerz";

const mockOrder = {
  id: "order_1",
  userId: "user_1",
  addressId: "address_1",
  status: "pending_payment",
  subtotal: 400,
  deliveryFee: 50,
  total: 450,
  idempotencyKey: "key_123",
  paymentStatus: "pending",
  sslTxnId: "txn_123",
  sslAmount: null,
  sslHash: null,
  paymentMethod: null,
  items: [],
  address: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("Payment Validate API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/payment/validate", () => {
    it("validates payment successfully", async () => {
      vi.mocked(validatePayment).mockResolvedValue({
        status: "VALID",
        tran_id: "txn_123",
        val_id: "val_123",
        amount: "450",
        bank_tran_id: "bank_123",
        card_type: "VISA",
        card_no: "4111",
        card_issuer: "Test Bank",
        card_brand: "VISA",
        card_issuer_country: "Bangladesh",
        card_issuer_country_code: "BD",
        currency: "BDT",
        currency_amount: "450",
        settled_amount: "450",
        settled_date: "2024-01-01",
        txn_status: "VALID",
        reason: "Successful",
        gateway_page_url: "https://sandbox.sslcommerz.com/gwprocess/v4/test.php",
      } as any);
      vi.mocked(prisma.order.findFirst).mockResolvedValue(mockOrder as any);
      vi.mocked(prisma.order.update).mockResolvedValue({
        ...mockOrder,
        status: "paid",
        paymentStatus: "paid",
        sslAmount: 450,
      } as any);

      const request = new Request("http://localhost/api/payment/validate", {
        method: "POST",
        body: "val_id=val_123&store_id=test&store_passwd=test",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("VALID");
      expect(data.tran_id).toBe("txn_123");
      expect(data.amount).toBe(450);
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: "order_1" },
        data: {
          status: "paid",
          paymentStatus: "paid",
          sslAmount: 450,
        },
      });
    });

    it("returns 400 when val_id is missing", async () => {
      const request = new Request("http://localhost/api/payment/validate", {
        method: "POST",
        body: "",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("val_id is required");
    });

    it("returns 404 when order not found", async () => {
      vi.mocked(validatePayment).mockResolvedValue({
        status: "VALID",
        tran_id: "txn_nonexistent",
        val_id: "val_123",
        amount: "450",
      } as any);
      vi.mocked(prisma.order.findFirst).mockResolvedValue(null);

      const request = new Request("http://localhost/api/payment/validate", {
        method: "POST",
        body: "val_id=val_123&store_id=test&store_passwd=test",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Order not found");
    });

    it("returns 400 when amount mismatches", async () => {
      vi.mocked(validatePayment).mockResolvedValue({
        status: "VALID",
        tran_id: "txn_123",
        val_id: "val_123",
        amount: "500",
      } as any);
      vi.mocked(prisma.order.findFirst).mockResolvedValue(mockOrder as any);
      vi.mocked(prisma.order.update).mockResolvedValue(mockOrder as any);

      const request = new Request("http://localhost/api/payment/validate", {
        method: "POST",
        body: "val_id=val_123&store_id=test&store_passwd=test",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Amount mismatch");
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: "order_1" },
        data: {
          status: "payment_failed",
          paymentStatus: "failed",
        },
      });
    });

    it("returns 400 when payment status is not VALID", async () => {
      vi.mocked(validatePayment).mockResolvedValue({
        status: "FAILED",
        tran_id: "txn_123",
        val_id: "val_123",
        amount: "450",
      } as any);
      vi.mocked(prisma.order.findFirst).mockResolvedValue(mockOrder as any);
      vi.mocked(prisma.order.update).mockResolvedValue(mockOrder as any);

      const request = new Request("http://localhost/api/payment/validate", {
        method: "POST",
        body: "val_id=val_123&store_id=test&store_passwd=test",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Payment not valid");
    });

    it("returns 500 when validation request fails", async () => {
      vi.mocked(validatePayment).mockRejectedValueOnce(new Error("Network error"));

      const request = new Request("http://localhost/api/payment/validate", {
        method: "POST",
        body: "val_id=val_123&store_id=test&store_passwd=test",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Validation request failed");
    });
  });

  describe("GET /api/payment/validate", () => {
    it("validates payment via GET with val_id query param", async () => {
      vi.mocked(validatePayment).mockResolvedValue({
        status: "VALID",
        tran_id: "txn_123",
        val_id: "val_123",
        amount: "450",
      } as any);
      vi.mocked(prisma.order.findFirst).mockResolvedValue(mockOrder as any);
      vi.mocked(prisma.order.update).mockResolvedValue({
        ...mockOrder,
        status: "paid",
        paymentStatus: "paid",
        sslAmount: 450,
      } as any);

      const request = new Request("http://localhost/api/payment/validate?val_id=val_123");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("VALID");
      expect(data.tran_id).toBe("txn_123");
    });

    it("returns 400 when val_id is missing in GET", async () => {
      const request = new Request("http://localhost/api/payment/validate");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("val_id is required");
    });
  });
});

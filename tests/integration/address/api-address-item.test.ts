import { describe, it, expect, vi, beforeEach } from "vitest";
import { PUT } from "@/app/api/user/address/[id]/route";
import { DELETE } from "@/app/api/user/address/[id]/route";

vi.mock("@/lib/prisma", () => ({
  default: {
    address: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

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

describe("Address Item API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("PUT /api/user/address/[id]", () => {
    it("updates address when it belongs to user", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user_1" },
      } as any);
      vi.mocked(prisma.address.findFirst).mockResolvedValue(mockAddress as any);
      vi.mocked(prisma.address.update).mockResolvedValue({ ...mockAddress, city: "Chittagong" } as any);

      const request = new Request("http://localhost/api/user/address/address_1", {
        method: "PUT",
        body: JSON.stringify({
          fullName: "Test User",
          phone: "01700000000",
          line1: "123 Test Street",
          city: "Chittagong",
          postalCode: "1230",
          country: "BD",
        }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await PUT(request, { params: Promise.resolve({ id: "address_1" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.address.city).toBe("Chittagong");
      expect(prisma.address.update).toHaveBeenCalledWith({
        where: { id: "address_1" },
        data: {
          fullName: "Test User",
          phone: "01700000000",
          line1: "123 Test Street",
          line2: undefined,
          city: "Chittagong",
          postalCode: "1230",
          country: "BD",
        },
      });
    });

    it("returns 401 when not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const request = new Request("http://localhost/api/user/address/address_1", {
        method: "PUT",
        body: JSON.stringify({ city: "Chittagong" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await PUT(request, { params: Promise.resolve({ id: "address_1" }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 404 when address does not belong to user", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user_1" },
      } as any);
      vi.mocked(prisma.address.findFirst).mockResolvedValue(null);

      const request = new Request("http://localhost/api/user/address/address_user2", {
        method: "PUT",
        body: JSON.stringify({
          fullName: "Test User",
          phone: "01700000000",
          line1: "123 Test Street",
          city: "Chittagong",
          postalCode: "1230",
          country: "BD",
        }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await PUT(request, { params: Promise.resolve({ id: "address_user2" }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Address not found");
    });

    it("returns 400 for invalid address data", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user_1" },
      } as any);
      vi.mocked(prisma.address.findFirst).mockResolvedValue(mockAddress as any);

      const request = new Request("http://localhost/api/user/address/address_1", {
        method: "PUT",
        body: JSON.stringify({
          fullName: "",
          phone: "123",
          line1: "x",
          city: "D",
          postalCode: "1",
        }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await PUT(request, { params: Promise.resolve({ id: "address_1" }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Full name is required");
    });
  });

  describe("DELETE /api/user/address/[id]", () => {
    it("deletes address when it belongs to user", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user_1" },
      } as any);
      vi.mocked(prisma.address.findFirst).mockResolvedValue(mockAddress as any);
      vi.mocked(prisma.address.delete).mockResolvedValue(mockAddress as any);
      vi.mocked(prisma.address.findMany).mockResolvedValue([] as any);

      const request = new Request("http://localhost/api/user/address/address_1", {
        method: "DELETE",
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: "address_1" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(prisma.address.delete).toHaveBeenCalledWith({ where: { id: "address_1" } });
    });

    it("returns 401 when not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const request = new Request("http://localhost/api/user/address/address_1", {
        method: "DELETE",
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: "address_1" }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 404 when address does not belong to user", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user_1" },
      } as any);
      vi.mocked(prisma.address.findFirst).mockResolvedValue(null);

      const request = new Request("http://localhost/api/user/address/address_user2", {
        method: "DELETE",
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: "address_user2" }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Address not found");
    });

    it("promotes another address to default when deleting default address", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user_1" },
      } as any);
      vi.mocked(prisma.address.findFirst).mockResolvedValue(mockAddress as any);
      vi.mocked(prisma.address.delete).mockResolvedValue(mockAddress as any);
      vi.mocked(prisma.address.findMany).mockResolvedValue([
        { id: "address_2", isDefault: false },
      ] as any);
      vi.mocked(prisma.address.update).mockResolvedValue({
        id: "address_2",
        isDefault: true,
      } as any);

      const request = new Request("http://localhost/api/user/address/address_1", {
        method: "DELETE",
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: "address_1" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(prisma.address.update).toHaveBeenCalledWith({
        where: { id: "address_2" },
        data: { isDefault: true },
      });
    });
  });
});

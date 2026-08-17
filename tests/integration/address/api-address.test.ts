import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/user/address/route";
import { POST } from "@/app/api/user/address/route";

vi.mock("@/lib/prisma", () => ({
  default: {
    address: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
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

describe("Address API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/user/address", () => {
    it("returns addresses for authenticated user", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user_1" },
      } as any);
      vi.mocked(prisma.address.findMany).mockResolvedValue([mockAddress] as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.addresses).toHaveLength(1);
      expect(data.addresses[0].id).toBe("address_1");
    });

    it("returns 401 when not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("POST /api/user/address", () => {
    it("creates address for authenticated user", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user_1" },
      } as any);
      vi.mocked(prisma.address.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.address.create).mockResolvedValue(mockAddress as any);

      const request = new Request("http://localhost/api/user/address", {
        method: "POST",
        body: JSON.stringify({
          fullName: "Test User",
          phone: "01700000000",
          line1: "123 Test Street",
          city: "Dhaka",
          postalCode: "1230",
          country: "BD",
        }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.address.id).toBe("address_1");
      expect(prisma.address.create).toHaveBeenCalledWith({
        data: {
          userId: "user_1",
          fullName: "Test User",
          phone: "01700000000",
          line1: "123 Test Street",
          line2: undefined,
          city: "Dhaka",
          postalCode: "1230",
          country: "BD",
          isDefault: true,
        },
      });
    });

    it("returns 401 when not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const request = new Request("http://localhost/api/user/address", {
        method: "POST",
        body: JSON.stringify({
          fullName: "Test User",
          phone: "01700000000",
          line1: "123 Test Street",
          city: "Dhaka",
          postalCode: "1230",
        }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 400 for invalid address data", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user_1" },
      } as any);

      const request = new Request("http://localhost/api/user/address", {
        method: "POST",
        body: JSON.stringify({
          fullName: "",
          phone: "123",
          line1: "x",
          city: "D",
          postalCode: "1",
        }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Full name is required");
    });
  });
});

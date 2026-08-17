import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/user/me/route";
import { GET as GETProfile } from "@/app/api/user/profile/route";
import { PATCH } from "@/app/api/user/profile/route";

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    address: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
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

const mockUser = {
  id: "user_1",
  name: "Test User",
  email: "test@example.com",
  image: null,
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

describe("User Profile API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/user/me", () => {
    it("returns user profile with addresses", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user_1" },
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.address.findMany).mockResolvedValue([mockAddress] as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.profile.id).toBe("user_1");
      expect(data.profile.name).toBe("Test User");
      expect(data.addresses).toHaveLength(1);
      expect(data.addresses[0].phone).toBe("01700000000");
    });

    it("returns 401 when not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 404 when user not found", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user_1" },
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("User not found");
    });
  });

  describe("GET /api/user/profile", () => {
    it("returns user profile with default phone", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user_1" },
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.address.findFirst).mockResolvedValue(mockAddress as any);

      const response = await GETProfile();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.id).toBe("user_1");
      expect(data.user.email).toBe("test@example.com");
      expect(data.phone).toBe("01700000000");
    });

    it("returns empty phone when no default address", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user_1" },
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.address.findFirst).mockResolvedValue(null);

      const response = await GETProfile();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.phone).toBe("");
    });

    it("returns 404 when user not found", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user_1" },
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const response = await GETProfile();
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("User not found");
    });
  });

  describe("PATCH /api/user/profile", () => {
    it("updates user profile", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user_1" },
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.update).mockResolvedValue({
        ...mockUser,
        name: "Updated User",
      } as any);

      const request = new Request("http://localhost/api/user/profile", {
        method: "PATCH",
        body: JSON.stringify({ name: "Updated User" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.name).toBe("Updated User");
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user_1" },
        data: { name: "Updated User", image: null },
        select: { id: true, name: true, email: true, image: true },
      });
    });

    it("returns 401 when not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const request = new Request("http://localhost/api/user/profile", {
        method: "PATCH",
        body: JSON.stringify({ name: "Updated User" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 400 when no fields to update", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user_1" },
      } as any);

      const request = new Request("http://localhost/api/user/profile", {
        method: "PATCH",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("No fields to update");
    });

    it("returns 404 when user not found", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user_1" },
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const request = new Request("http://localhost/api/user/profile", {
        method: "PATCH",
        body: JSON.stringify({ name: "Updated User" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("User not found");
    });
  });
});

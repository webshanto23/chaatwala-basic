import { describe, it, expect, vi, beforeEach } from "vitest";
import { getStores, getStoreManagers, createStore, updateStore, deleteStore } from "@/features/stores/actions";

vi.mock("@/lib/prisma", () => ({
  default: {
    store: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
    role: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/authorize", () => ({
  authorize: vi.fn(),
  requirePermission: vi.fn(),
}));

vi.mock("@/app/actions/audit", () => ({
  logAction: vi.fn(),
}));

vi.mock("@/lib/image-upload", () => ({
  uploadImage: vi.fn(() => Promise.resolve({ url: "https://example.com/store.jpg", deleteUrl: "https://example.com/delete" })),
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
import { authorize, requirePermission } from "@/lib/authorize";

const mockStore = {
  id: "store_1",
  name: "Test Store",
  phone: "01700000000",
  address: "123 Test Street",
  imageUrl: "https://example.com/store.jpg",
  imageDeleteUrl: "https://example.com/delete",
  managerId: null,
  manager: null,
  createdAt: new Date(),
};

const mockManager = {
  id: "user_1",
  name: "Manager One",
  email: "manager@example.com",
};

describe("stores actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getStores", () => {
    it("returns stores when authorized", async () => {
      vi.mocked(authorize).mockResolvedValue({ authorized: true, session: null } as any);
      vi.mocked(prisma.store.findMany).mockResolvedValue([mockStore] as any);

      const result = await getStores();
      expect(result).toEqual({ stores: [expect.objectContaining({ id: "store_1" })] });
      expect(prisma.store.findMany).toHaveBeenCalled();
    });

    it("returns error when not authorized", async () => {
      vi.mocked(authorize).mockResolvedValue({ authorized: false, session: null } as any);

      const result = await getStores();
      expect(result).toEqual({ error: "Forbidden" });
    });
  });

  describe("getStoreManagers", () => {
    it("returns managers when authorized", async () => {
      vi.mocked(authorize).mockResolvedValue({ authorized: true, session: null } as any);
      vi.mocked(prisma.role.findUnique).mockResolvedValue({ id: "role_store_manager" } as any);
      vi.mocked(prisma.user.findMany).mockResolvedValue([mockManager] as any);

      const result = await getStoreManagers();
      expect(result).toEqual({ managers: [expect.objectContaining({ id: "user_1" })] });
    });

    it("returns empty managers when store_manager role not found", async () => {
      vi.mocked(authorize).mockResolvedValue({ authorized: true, session: null } as any);
      vi.mocked(prisma.role.findUnique).mockResolvedValue(null);

      const result = await getStoreManagers();
      expect(result).toEqual({ managers: [] });
    });
  });

  describe("createStore", () => {
    it("creates store with valid data when authorized", async () => {
      vi.mocked(requirePermission).mockResolvedValue({ authorized: true, session: { user: { id: "admin_1" } } } as any);
      vi.mocked(prisma.store.create).mockResolvedValue(mockStore as any);

      const formData = new FormData();
      formData.append("name", "Test Store");
      formData.append("phone", "01700000000");
      formData.append("address", "123 Test Street");
      formData.append("image", new File(["test"], "store.jpg", { type: "image/jpeg" }));

      const result = await createStore(formData);
      expect(result).toEqual({ success: true, store: expect.objectContaining({ id: "store_1" }) });
      expect(prisma.store.create).toHaveBeenCalled();
    });

    it("returns error when required fields missing", async () => {
      vi.mocked(requirePermission).mockResolvedValue({ authorized: true, session: { user: { id: "admin_1" } } } as any);

      const formData = new FormData();
      formData.append("name", "");
      formData.append("phone", "01700000000");
      formData.append("address", "123 Test Street");
      formData.append("image", new File(["test"], "store.jpg", { type: "image/jpeg" }));

      const result = await createStore(formData);
      expect(result).toEqual({ error: "Name, phone, and address are required" });
    });

    it("returns error when image is invalid type", async () => {
      vi.mocked(requirePermission).mockResolvedValue({ authorized: true, session: { user: { id: "admin_1" } } } as any);

      const formData = new FormData();
      formData.append("name", "Test Store");
      formData.append("phone", "01700000000");
      formData.append("address", "123 Test Street");
      formData.append("image", new File(["test"], "store.txt", { type: "text/plain" }));

      const result = await createStore(formData);
      expect(result).toEqual({ error: "Only JPG, PNG, WEBP, or GIF images are allowed" });
    });

    it("returns error when not authorized", async () => {
      vi.mocked(requirePermission).mockResolvedValue({ authorized: false, session: null } as any);

      const formData = new FormData();
      formData.append("name", "Test Store");
      formData.append("phone", "01700000000");
      formData.append("address", "123 Test Street");

      const result = await createStore(formData);
      expect(result).toEqual({ error: "Forbidden" });
    });
  });

  describe("updateStore", () => {
    it("updates store when authorized", async () => {
      vi.mocked(requirePermission).mockResolvedValue({ authorized: true, session: { user: { id: "admin_1" } } } as any);
      vi.mocked(prisma.store.findUnique).mockResolvedValue(mockStore as any);
      vi.mocked(prisma.store.update).mockResolvedValue({ ...mockStore, name: "Updated Store" } as any);

      const formData = new FormData();
      formData.append("name", "Updated Store");
      formData.append("phone", "01700000000");
      formData.append("address", "123 Test Street");

      const result = await updateStore("store_1", formData);
      expect(result).toEqual({ success: true, store: expect.objectContaining({ name: "Updated Store" }) });
    });

    it("returns error when store not found", async () => {
      vi.mocked(requirePermission).mockResolvedValue({ authorized: true, session: { user: { id: "admin_1" } } } as any);
      vi.mocked(prisma.store.findUnique).mockResolvedValue(null);

      const formData = new FormData();
      formData.append("name", "Updated Store");
      formData.append("phone", "01700000000");
      formData.append("address", "123 Test Street");

      const result = await updateStore("nonexistent", formData);
      expect(result).toEqual({ error: "Store not found" });
    });

    it("returns error when not authorized", async () => {
      vi.mocked(requirePermission).mockResolvedValue({ authorized: false, session: null } as any);

      const formData = new FormData();
      formData.append("name", "Updated Store");

      const result = await updateStore("store_1", formData);
      expect(result).toEqual({ error: "Forbidden" });
    });
  });

  describe("deleteStore", () => {
    it("deletes store when authorized", async () => {
      vi.mocked(requirePermission).mockResolvedValue({ authorized: true, session: { user: { id: "admin_1" } } } as any);
      vi.mocked(prisma.store.findUnique).mockResolvedValue(mockStore as any);
      vi.mocked(prisma.store.delete).mockResolvedValue(mockStore as any);

      const result = await deleteStore("store_1");
      expect(result).toEqual({ success: true });
      expect(prisma.store.delete).toHaveBeenCalledWith({ where: { id: "store_1" } });
    });

    it("returns error when store not found", async () => {
      vi.mocked(requirePermission).mockResolvedValue({ authorized: true, session: { user: { id: "admin_1" } } } as any);
      vi.mocked(prisma.store.findUnique).mockResolvedValue(null);

      const result = await deleteStore("nonexistent");
      expect(result).toEqual({ error: "Store not found" });
    });

    it("returns error when not authorized", async () => {
      vi.mocked(requirePermission).mockResolvedValue({ authorized: false, session: null } as any);

      const result = await deleteStore("store_1");
      expect(result).toEqual({ error: "Forbidden" });
    });
  });
});

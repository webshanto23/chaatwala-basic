"use server";

import { authorize, requirePermission } from "@/lib/authorize";
import { unstable_cache, revalidateTag } from "next/cache";
import prisma from "@/lib/prisma";
import { logAction } from "@/app/actions/audit";
import { uploadImage } from "@/lib/image-upload";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

type Store = {
  id: string;
  name: string;
  phone: string;
  address: string;
  imageUrl: string | null;
  imageDeleteUrl: string | null;
  managerId: string | null;
  manager: { id: string; name: string | null; email: string } | null;
  createdAt: Date;
};

type Manager = { id: string; name: string | null; email: string };

export async function getStores(): Promise<{ stores: Store[] } | { error: string }> {
  const { authorized } = await authorize({ permissions: ["store:view"] });
  if (!authorized) return { error: "Forbidden" };

  const stores = await unstable_cache(
    async () => {
      return prisma.store.findMany({
        select: {
          id: true,
          name: true,
          phone: true,
          address: true,
          imageUrl: true,
          managerId: true,
          manager: { select: { id: true, name: true, email: true } },
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });
    },
    ["admin-stores"],
    { revalidate: 120, tags: ["stores"] }
  )();

  return {
    stores: stores.map((s) => ({
      id: s.id,
      name: s.name,
      phone: s.phone,
      address: s.address,
      imageUrl: s.imageUrl,
      imageDeleteUrl: null,
      managerId: s.managerId,
      manager: s.manager ? { id: s.manager.id, name: s.manager.name, email: s.manager.email } : null,
      createdAt: s.createdAt,
    })),
  };
}

export async function getStoreManagers(): Promise<{ managers: Manager[] } | { error: string }> {
  const { authorized } = await authorize({ permissions: ["store:view"] });
  if (!authorized) return { error: "Forbidden", managers: [] };

  const managers = await unstable_cache(
    async () => {
      const storeManagerRole = await prisma.role.findUnique({ where: { name: "store_manager" } });
      if (!storeManagerRole) return [];
      return prisma.user.findMany({
        where: { roleId: storeManagerRole.id },
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      });
    },
    ["admin-store-managers"],
    { revalidate: 120, tags: ["store-managers"] }
  )();

  return { managers };
}

export async function createStore(formData: FormData): Promise<{ success: true; store: Store } | { error: string }> {
  const { authorized, session } = await requirePermission("store:create");
  if (!authorized || !session?.user) return { error: "Forbidden" };

  const file = formData.get("image") as File | null;
  if (!file || !(file instanceof File) || file.size === 0) {
    return { error: "Store image is required" };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Only JPG, PNG, WEBP, or GIF images are allowed" };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { error: "Image must be 5MB or less" };
  }

  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const managerId = formData.get("managerId") as string | null;

  if (!name || !phone || !address) {
    return { error: "Name, phone, and address are required" };
  }

  const { url: imageUrl, deleteUrl: imageDeleteUrl } = await uploadImage(file, { alt: name });

  let store: Store;
  try {
    store = await prisma.store.create({
      data: {
        name,
        phone,
        address,
        imageUrl,
        imageDeleteUrl,
        managerId: managerId || undefined,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        imageUrl: true,
        imageDeleteUrl: true,
        managerId: true,
        manager: { select: { id: true, name: true, email: true } },
        createdAt: true,
      },
    });
  } catch (error) {
    const err = error as { code?: string; message?: string } | null;
    if (err?.code === "P2002") {
      return { error: "Store manager can't be same" };
    }
    throw error;
  }

  await logAction({
    userId: session.user.id,
    action: "CREATE_STORE",
    entity: "Store",
    entityId: store.id,
    metadata: { name: store.name },
  });

  revalidateTag("stores", "default");
  revalidateTag("store-managers", "default");

  return { success: true, store };
}

export async function updateStore(id: string, formData: FormData): Promise<{ success: true; store: Store } | { error: string }> {
  const { authorized, session } = await requirePermission("store:update");
  if (!authorized || !session?.user) return { error: "Forbidden" };

  const existing = await prisma.store.findUnique({ where: { id } });
  if (!existing) return { error: "Store not found" };

  const file = formData.get("image") as File | null;
  let imageUrl = existing.imageUrl;
  let imageDeleteUrl = existing.imageDeleteUrl;

  if (file && file instanceof File && file.size > 0) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { error: "Only JPG, PNG, WEBP, or GIF images are allowed" };
    }
    if (file.size > MAX_FILE_SIZE) {
      return { error: "Image must be 5MB or less" };
    }

    const { url: newImageUrl, deleteUrl: newDeleteUrl } = await uploadImage(file, { alt: existing.name });
    imageUrl = newImageUrl;
    imageDeleteUrl = newDeleteUrl ?? null;

    if (existing.imageDeleteUrl) {
      try {
        await fetch(existing.imageDeleteUrl, { method: "DELETE", signal: AbortSignal.timeout(10000) });
      } catch {
        // ignore cleanup errors
      }
    }
  }

  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const managerId = formData.get("managerId") as string | null;

  if (!name || !phone || !address) {
    return { error: "Name, phone, and address are required" };
  }

  let store: Store;
  try {
    store = await prisma.store.update({
      where: { id },
      data: {
        name,
        phone,
        address,
        imageUrl,
        imageDeleteUrl,
        managerId: managerId || undefined,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        imageUrl: true,
        imageDeleteUrl: true,
        managerId: true,
        manager: { select: { id: true, name: true, email: true } },
        createdAt: true,
      },
    });
  } catch (error) {
    const err = error as { code?: string; message?: string } | null;
    if (err?.code === "P2002") {
      return { error: "Store manager can't be same" };
    }
    throw error;
  }

  await logAction({
    userId: session.user.id,
    action: "UPDATE_STORE",
    entity: "Store",
    entityId: store.id,
    metadata: { name: store.name },
  });

  revalidateTag("stores", "default");
  revalidateTag("store-managers", "default");

  return { success: true, store };
}

export async function deleteStore(id: string): Promise<{ success: true } | { error: string }> {
  const { authorized, session } = await requirePermission("store:delete");
  if (!authorized || !session?.user) return { error: "Forbidden" };

  const store = await prisma.store.findUnique({ where: { id } });
  if (!store) return { error: "Store not found" };

  await prisma.store.delete({ where: { id } });

  if (store.imageDeleteUrl) {
    try {
      await fetch(store.imageDeleteUrl, { method: "DELETE", signal: AbortSignal.timeout(10000) });
    } catch {
      // ignore cleanup errors
    }
  }

  await logAction({
    userId: session.user.id,
    action: "DELETE_STORE",
    entity: "Store",
    entityId: id,
    metadata: { name: store.name },
  });

  revalidateTag("stores", "default");

  return { success: true };
}

"use server";

import { authorize, requireWorkspace, requirePermission } from "@/lib/authorize";
import { unstable_cache, revalidateTag } from "next/cache";
import prisma from "@/lib/prisma";
import { logAction } from "@/app/actions/audit";
import { uploadImage } from "@/lib/image-upload";
import { z } from "zod";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function revalidateStoreData() {
  revalidateTag("stores", "default");
  revalidateTag("store-managers", "default");
  revalidateTag("store-info", "default");
  revalidateTag("store-availability", "default");
}

type Store = {
  id: string;
  name: string;
  phone: string;
  address: string;
  imageUrl: string | null;
  imageDeleteUrl: string | null;
  managerId: string | null;
  manager: { id: string; name: string | null; username: string | null; email: string | null } | null;
  createdAt: Date;
};

type Manager = { id: string; name: string | null; username: string | null; email: string | null; storeIds: string[] };

export async function getStores(): Promise<{ stores: Store[] } | { error: string }> {
  const { authorized: roleAuthorized } = await requireWorkspace("staff");
  if (!roleAuthorized) return { error: "Forbidden" };

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
          manager: { select: { id: true, name: true, username: true, email: true } },
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
      manager: s.manager ? { id: s.manager.id, name: s.manager.name, username: s.manager.username, email: s.manager.email } : null,
      createdAt: s.createdAt,
    })),
  };
}

export async function getStoreManagers(): Promise<{ managers: Manager[] } | { error: string }> {
  const { authorized: roleAuthorized } = await requireWorkspace("staff");
  if (!roleAuthorized) return { error: "Forbidden", managers: [] };

  const { authorized } = await authorize({ permissions: ["store:view"] });
  if (!authorized) return { error: "Forbidden", managers: [] };

  const managers = await unstable_cache(
    async () => {
      return prisma.user.findMany({
        where: {
          isActive: true,
          staffRole: { workspace: "STAFF", isSystem: false },
          storeAccess: { some: {} },
        },
        select: { id: true, name: true, username: true, email: true, storeAccess: { select: { storeId: true } } },
        orderBy: { name: "asc" },
      }).then((staff) => staff.map(({ storeAccess, ...member }) => ({ ...member, storeIds: storeAccess.map(({ storeId }) => storeId) })));
    },
    ["admin-store-managers"],
    { revalidate: 120, tags: ["store-managers"] }
  )();

  return { managers };
}

async function isEligibleStoreManager(userId: string, storeId: string) {
  return Boolean(await prisma.user.findFirst({
    where: {
      id: userId,
      isActive: true,
      staffRole: { workspace: "STAFF", isSystem: false },
      storeAccess: { some: { storeId } },
    },
    select: { id: true },
  }));
}

export async function createStore(formData: FormData): Promise<{ success: true; store: Store } | { error: string }> {
  const { authorized, session } = await requirePermission("store:create");
  if (!authorized || !session?.user) return { error: "Forbidden" };

  const managerId = String(formData.get("managerId") ?? "").trim();
  if (managerId) return { error: "Assign a manager after creating the store and granting store access" };

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
      },
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        imageUrl: true,
        imageDeleteUrl: true,
        managerId: true,
        manager: { select: { id: true, name: true, username: true, email: true } },
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

  revalidateStoreData();

  return { success: true, store };
}

export async function updateStore(id: string, formData: FormData): Promise<{ success: true; store: Store } | { error: string }> {
  const { authorized, session } = await requirePermission("store:update");
  if (!authorized || !session?.user) return { error: "Forbidden" };

  const existing = await prisma.store.findUnique({ where: { id } });
  if (!existing) return { error: "Store not found" };

  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const managerId = String(formData.get("managerId") ?? "").trim() || null;
  if (!name || !phone || !address) return { error: "Name, phone, and address are required" };
  if (managerId && !z.string().cuid().safeParse(managerId).success) return { error: "Invalid store manager" };
  if (managerId && !(await isEligibleStoreManager(managerId, id))) return { error: "Select an active staff member assigned to this store" };

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
        managerId,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        imageUrl: true,
        imageDeleteUrl: true,
        managerId: true,
        manager: { select: { id: true, name: true, username: true, email: true } },
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

  revalidateStoreData();

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

  revalidateStoreData();

  return { success: true };
}

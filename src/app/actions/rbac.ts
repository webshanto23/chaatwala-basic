"use server";

import { authorize, requirePermission } from "@/lib/authorize";
import { unstable_cache, revalidateTag } from "next/cache";
import prisma from "@/lib/prisma";
import { logAction } from "./audit";

export async function getUsers() {
  const { authorized } = await authorize({ permissions: ["user:view"] });
  if (!authorized) {
    return { error: "Forbidden" };
  }

  const [users, roles] = await Promise.all([
    unstable_cache(
      async () => {
        return prisma.user.findMany({
          select: { id: true, name: true, email: true, roleId: true, createdAt: true },
          orderBy: { createdAt: "desc" },
        });
      },
      ["admin-users"],
      { revalidate: 60, tags: ["users"] }
    )(),
    unstable_cache(
      async () => {
        return prisma.role.findMany({ select: { id: true, name: true } });
      },
      ["admin-roles-list"],
      { revalidate: 120, tags: ["roles"] }
    )(),
  ]);

  return { users, roles };
}

export async function getDishes() {
  const { authorized } = await authorize({ permissions: ["food:view"] });
  if (!authorized) {
    return { error: "Forbidden" };
  }

  const dishes = await prisma.dish.findMany({
    orderBy: { createdAt: "desc" },
  });

  return { dishes };
}

export async function updateUserRole(formData: FormData) {
  const { authorized, session } = await requirePermission("user:updateRole");
  if (!authorized || !session?.user) return { error: "Forbidden" };

  const userId = formData.get("userId") as string;
  const roleId = formData.get("roleId") as string;

  if (userId === session.user.id) {
    return { error: "You cannot change your own role" };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found" };

  const newRole = await prisma.role.findUnique({ where: { id: roleId } });
  if (!newRole) return { error: "Role not found" };

  await prisma.user.update({
    where: { id: userId },
    data: { roleId },
  });

  await logAction({
    userId: session.user.id,
    action: "USER_ROLE_UPDATE",
    entity: "User",
    entityId: userId,
    metadata: { oldRoleId: user.roleId, newRoleId: roleId, newRoleName: newRole.name },
  });

  revalidateTag("users", "default");

  return { success: true };
}

export async function deleteUser(formData: FormData) {
  const { authorized, session } = await requirePermission("user:delete");
  if (!authorized || !session?.user) return { error: "Forbidden" };

  const userId = formData.get("userId") as string;

  if (userId === session.user.id) {
    return { error: "You cannot delete your own account" };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found" };

  await prisma.user.delete({ where: { id: userId } });

  await logAction({
    userId: session.user.id,
    action: "USER_DELETE",
    entity: "User",
    entityId: userId,
    metadata: { email: user.email },
  });

  revalidateTag("users", "default");

  return { success: true };
}

export async function getRoles() {
  const { authorized } = await authorize({ permissions: ["role:manage"] });
  if (!authorized) {
    return { error: "Forbidden" };
  }

  const roles = await unstable_cache(
    async () => {
      return prisma.role.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          permissions: {
            select: {
              permission: {
                select: { id: true, name: true, description: true },
              },
            },
          },
        },
      });
    },
    ["admin-roles"],
    { revalidate: 120, tags: ["roles"] }
  )();

  return { roles };
}

export async function getPermissions() {
  const { authorized } = await authorize({ permissions: ["role:manage"] });
  if (!authorized) {
    return { error: "Forbidden" };
  }

  const permissions = await unstable_cache(
    async () => {
      return prisma.permission.findMany({ select: { id: true, name: true, description: true }, orderBy: { name: "asc" } });
    },
    ["admin-permissions"],
    { revalidate: 120, tags: ["permissions"] }
  )();

  return { permissions };
}

export async function assignPermissionToRole(formData: FormData) {
  const { authorized, session } = await requirePermission("role:manage");
  if (!authorized || !session?.user) return { error: "Forbidden" };

  const roleId = formData.get("roleId") as string;
  const permissionId = formData.get("permissionId") as string;

  await prisma.rolePermission.create({
    data: { roleId, permissionId },
  });

  await logAction({
    userId: session.user.id,
    action: "PERMISSION_ASSIGN",
    entity: "Role",
    entityId: roleId,
    metadata: { permissionId },
  });

  revalidateTag("roles", "default");
  revalidateTag("permissions", "default");

  return { success: true };
}

export async function removePermissionFromRole(formData: FormData) {
  const { authorized, session } = await requirePermission("role:manage");
  if (!authorized || !session?.user) return { error: "Forbidden" };

  const roleId = formData.get("roleId") as string;
  const permissionId = formData.get("permissionId") as string;

  await prisma.rolePermission.delete({
    where: { roleId_permissionId: { roleId, permissionId } },
  });

  await logAction({
    userId: session.user.id,
    action: "PERMISSION_REMOVE",
    entity: "Role",
    entityId: roleId,
    metadata: { permissionId },
  });

  revalidateTag("roles", "default");
  revalidateTag("permissions", "default");

  return { success: true };
}

export async function getOrders(filters?: { status?: string; limit?: number; cursor?: string }) {
  const { authorized } = await authorize({ permissions: ["admin:access"] });
  if (!authorized) {
    return { error: "Forbidden" };
  }

  const where: Record<string, unknown> = {};
  if (filters?.status) where.status = filters.status;

  const take = filters?.limit ?? 50;
  const cursor = filters?.cursor ? { id: filters.cursor } : undefined;

  const orders = await unstable_cache(
    async () => {
      const result = await prisma.order.findMany({
        where,
        select: { id: true, userId: true, user: { select: { name: true, email: true } }, status: true, total: true, sslTxnId: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take,
        ...(cursor ? { skip: 1, cursor } : {}),
      });
      return result;
    },
    ["admin-orders-v2", filters?.status ?? "all", String(take), filters?.cursor ?? "start"],
    { revalidate: 300, tags: ["orders"] }
  )();

  const nextCursor = orders.length === take ? orders[orders.length - 1].id : null;

  return {
    orders: orders.map((order) => ({
      userId: order.userId ?? "-",
      userName: order.user?.name ?? order.user?.email ?? "-",
      orderId: order.id,
      status: order.status,
      total: Number(order.total).toFixed(2),
      transactionId: order.sslTxnId ?? "-",
      createdAt: order.createdAt,
    })),
    nextCursor,
  };
}

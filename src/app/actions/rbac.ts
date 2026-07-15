"use server";

import { authorize, requirePermission } from "@/lib/authorize";
import prisma from "@/lib/prisma";
import { logAction } from "./audit";

export async function getUsers() {
  const { authorized } = await authorize({ permissions: ["user:view"] });
  if (!authorized) {
    return { error: "Forbidden" };
  }

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, roleId: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const roles = await prisma.role.findMany({ select: { id: true, name: true } });

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

  return { success: true };
}

export async function getRoles() {
  const { authorized } = await authorize({ permissions: ["role:manage"] });
  if (!authorized) {
    return { error: "Forbidden" };
  }

  const roles = await prisma.role.findMany({
    include: {
      permissions: { include: { permission: true } },
    },
  });

  return { roles };
}

export async function getPermissions() {
  const { authorized } = await authorize({ permissions: ["role:manage"] });
  if (!authorized) {
    return { error: "Forbidden" };
  }

  const permissions = await prisma.permission.findMany({ orderBy: { name: "asc" } });
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

  return { success: true };
}

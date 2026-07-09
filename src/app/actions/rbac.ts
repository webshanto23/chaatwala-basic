"use server";

import { auth } from "@/lib/auth";
import { authorize } from "@/lib/authorize";
import prisma from "@/lib/prisma";
import { logAction } from "./audit";

export async function getUsers() {
  const { authorized } = await authorize({ permissions: ["users:view"] });
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

export async function updateUserRole(formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  const userId = formData.get("userId") as string;
  const roleId = formData.get("roleId") as string;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found" };

  await prisma.user.update({
    where: { id: userId },
    data: { roleId },
  });

  await logAction({
    userId: session.user.id,
    action: "USER_ROLE_UPDATE",
    entity: "User",
    entityId: userId,
    metadata: { oldRoleId: user.roleId, newRoleId: roleId },
  });

  return { success: true };
}

export async function deleteUser(formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  const userId = formData.get("userId") as string;

  await prisma.user.delete({ where: { id: userId } });

  await logAction({
    userId: session.user.id,
    action: "USER_DELETE",
    entity: "User",
    entityId: userId,
  });

  return { success: true };
}

export async function getRoles() {
  const { authorized } = await authorize({ permissions: ["admins:assign"] });
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
  const { authorized } = await authorize({ permissions: ["admins:assign"] });
  if (!authorized) {
    return { error: "Forbidden" };
  }

  const permissions = await prisma.permission.findMany({ orderBy: { name: "asc" } });
  return { permissions };
}

export async function assignPermissionToRole(formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

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
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

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

"use server";

import bcrypt from "bcrypt";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/authorize";
import { logAction } from "@/app/actions/audit";
import { checkRateLimit } from "@/lib/rate-limit";

const usernameSchema = z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{3,32}$/);
const createStaffSchema = z.object({
  name: z.string().trim().min(1).max(100),
  username: usernameSchema,
  password: z.string().min(8).max(128),
  roleId: z.string().cuid(),
  email: z.string().trim().email().optional().or(z.literal("")),
  storeIds: z.array(z.string().cuid()).max(100),
});

const staffAccountUpdateSchema = z.object({
  userId: z.string().cuid(),
  roleId: z.string().cuid(),
  storeIds: z.array(z.string().cuid()).max(100),
});

async function parseStoreIds(formData: FormData): Promise<string[] | null> {
  try {
    const value: unknown = JSON.parse(String(formData.get("storeIds") ?? "[]"));
    const parsed = z.array(z.string().cuid()).max(100).safeParse(value).data;
    return parsed ? [...new Set(parsed)] : null;
  } catch {
    return null;
  }
}

async function getRegularStaffAccount(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, staffRole: { select: { workspace: true, isSystem: true } } },
  });
  return user?.staffRole?.workspace === "STAFF" && !user.staffRole.isSystem ? user : null;
}

async function getRegularStaffRole(roleId: string) {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    select: { workspace: true, isSystem: true },
  });
  return role?.workspace === "STAFF" && !role.isSystem ? role : null;
}

async function storesExist(storeIds: string[]) {
  if (!storeIds.length) return true;
  const count = await prisma.store.count({ where: { id: { in: storeIds } } });
  return count === storeIds.length;
}

async function requireControlPlaneAccess() {
  const result = await requireSuperAdmin();
  if (!result.authorized || !result.session?.user) return { authorized: false as const, session: null };
  const rate = await checkRateLimit(`staff-control:${result.session.user.id}`, "strict");
  if (!rate.success) return { authorized: false as const, session: null };
  return result;
}

export async function createStaffAccount(formData: FormData): Promise<{ success: true } | { error: string }> {
  const { authorized, session } = await requireControlPlaneAccess();
  if (!authorized || !session?.user) return { error: "Forbidden" };
  const storeIds = await parseStoreIds(formData);
  if (!storeIds) return { error: "Invalid store assignments" };
  const parsed = createStaffSchema.safeParse({
    name: formData.get("name"), username: formData.get("username"), password: formData.get("password"), roleId: formData.get("roleId"), email: formData.get("email"),
    storeIds,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid staff account" };
  if (!(await storesExist(parsed.data.storeIds))) return { error: "One or more selected stores no longer exist" };
  const email = parsed.data.email ? parsed.data.email.toLowerCase() : null;
  const [role, identity] = await Promise.all([
    prisma.role.findUnique({ where: { id: parsed.data.roleId }, select: { workspace: true, isSystem: true } }),
    prisma.user.findFirst({ where: { OR: [{ username: parsed.data.username }, ...(email ? [{ email }] : [])] }, select: { id: true } }),
  ]);
  if (!role || role.workspace !== "STAFF" || role.isSystem) return { error: "Select a regular staff role" };
  if (identity) return { error: "Username or contact email is already in use" };
  const password = await bcrypt.hash(parsed.data.password, 12);
  const user = await prisma.user.create({ data: { name: parsed.data.name, username: parsed.data.username, email, password, staffRoleId: parsed.data.roleId, storeAccess: { create: parsed.data.storeIds.map((storeId, index) => ({ storeId, isPrimary: index === 0 })) } } });
  await logAction({ userId: session.user.id, action: "STAFF_CREATE", entity: "User", entityId: user.id, metadata: { username: user.username, roleId: parsed.data.roleId, storeIds: parsed.data.storeIds } });
  revalidateTag("staff", "default");
  revalidateTag("store-managers", "default");
  return { success: true };
}

export async function createStaffRole(formData: FormData): Promise<{ success: true } | { error: string }> {
  const { authorized, session } = await requireControlPlaneAccess();
  if (!authorized || !session?.user) return { error: "Forbidden" };
  const parsed = z.object({ name: z.string().trim().min(3).max(80), description: z.string().trim().max(240).optional() }).safeParse({ name: formData.get("name"), description: formData.get("description") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid role" };
  try {
    const role = await prisma.role.create({ data: { name: parsed.data.name, description: parsed.data.description || null, workspace: "STAFF" } });
    await logAction({ userId: session.user.id, action: "STAFF_ROLE_CREATE", entity: "Role", entityId: role.id, metadata: { name: role.name } });
    revalidateTag("staff", "default");
    return { success: true };
  } catch {
    return { error: "A role with that name already exists" };
  }
}

export async function assignPermissionToStaffRole(formData: FormData): Promise<{ success: true } | { error: string }> {
  const { authorized, session } = await requireControlPlaneAccess();
  if (!authorized || !session?.user) return { error: "Forbidden" };
  const parsed = z.object({ roleId: z.string().cuid(), permissionId: z.string().cuid() }).safeParse({ roleId: formData.get("roleId"), permissionId: formData.get("permissionId") });
  if (!parsed.success) return { error: "Invalid role or permission" };
  const role = await prisma.role.findUnique({ where: { id: parsed.data.roleId }, select: { workspace: true, isSystem: true } });
  if (!role || role.workspace !== "STAFF" || role.isSystem) return { error: "Select a regular staff role" };
  try {
    await prisma.rolePermission.create({ data: parsed.data });
  } catch {
    return { error: "Permission is already assigned" };
  }
  await prisma.user.updateMany({ where: { staffRoleId: parsed.data.roleId }, data: { sessionVersion: { increment: 1 } } });
  await logAction({ userId: session.user.id, action: "STAFF_ROLE_PERMISSION_ASSIGN", entity: "Role", entityId: parsed.data.roleId, metadata: { permissionId: parsed.data.permissionId } });
  revalidateTag("staff", "default");
  return { success: true };
}

export async function removePermissionFromStaffRole(formData: FormData): Promise<{ success: true } | { error: string }> {
  const { authorized, session } = await requireControlPlaneAccess();
  if (!authorized || !session?.user) return { error: "Forbidden" };
  const parsed = z.object({ roleId: z.string().cuid(), permissionId: z.string().cuid() }).safeParse({ roleId: formData.get("roleId"), permissionId: formData.get("permissionId") });
  if (!parsed.success) return { error: "Invalid role or permission" };
  if (!(await getRegularStaffRole(parsed.data.roleId))) return { error: "Select a regular staff role" };
  const deleted = await prisma.rolePermission.deleteMany({ where: parsed.data });
  if (!deleted.count) return { error: "Permission is not assigned to this role" };
  await prisma.user.updateMany({ where: { staffRoleId: parsed.data.roleId }, data: { sessionVersion: { increment: 1 } } });
  await logAction({ userId: session.user.id, action: "STAFF_ROLE_PERMISSION_REMOVE", entity: "Role", entityId: parsed.data.roleId, metadata: { permissionId: parsed.data.permissionId } });
  revalidateTag("staff", "default");
  return { success: true };
}

export async function updateStaffAccountAssignments(formData: FormData): Promise<{ success: true } | { error: string }> {
  const { authorized, session } = await requireControlPlaneAccess();
  if (!authorized || !session?.user) return { error: "Forbidden" };
  const storeIds = await parseStoreIds(formData);
  if (!storeIds) return { error: "Invalid store assignments" };
  const parsed = staffAccountUpdateSchema.safeParse({ userId: formData.get("userId"), roleId: formData.get("roleId"), storeIds });
  if (!parsed.success) return { error: "Invalid staff account update" };
  if (!(await storesExist(parsed.data.storeIds))) return { error: "One or more selected stores no longer exist" };
  const [user, role] = await Promise.all([getRegularStaffAccount(parsed.data.userId), getRegularStaffRole(parsed.data.roleId)]);
  if (!user) return { error: "This protected or invalid account cannot be changed" };
  if (!role) return { error: "Select a regular staff role" };
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { staffRoleId: parsed.data.roleId, sessionVersion: { increment: 1 } } }),
    prisma.staffStoreAccess.deleteMany({ where: { userId: user.id } }),
    prisma.staffStoreAccess.createMany({ data: parsed.data.storeIds.map((storeId, index) => ({ userId: user.id, storeId, isPrimary: index === 0 })) }),
  ]);
  await logAction({ userId: session.user.id, action: "STAFF_ASSIGNMENTS_UPDATE", entity: "User", entityId: user.id, metadata: { roleId: parsed.data.roleId, storeIds: parsed.data.storeIds } });
  revalidateTag("staff", "default");
  revalidateTag("store-managers", "default");
  return { success: true };
}

export async function setStaffAccountActive(formData: FormData): Promise<{ success: true } | { error: string }> {
  const { authorized, session } = await requireControlPlaneAccess();
  if (!authorized || !session?.user) return { error: "Forbidden" };
  const parsed = z.object({ userId: z.string().cuid(), isActive: z.enum(["true", "false"]) }).safeParse({ userId: formData.get("userId"), isActive: formData.get("isActive") });
  if (!parsed.success) return { error: "Invalid staff account" };
  const user = await getRegularStaffAccount(parsed.data.userId);
  if (!user) return { error: "This protected or invalid account cannot be changed" };
  const isActive = parsed.data.isActive === "true";
  await prisma.user.update({ where: { id: user.id }, data: { isActive, sessionVersion: { increment: 1 } } });
  await logAction({ userId: session.user.id, action: isActive ? "STAFF_ENABLE" : "STAFF_DISABLE", entity: "User", entityId: user.id });
  revalidateTag("staff", "default");
  revalidateTag("store-managers", "default");
  return { success: true };
}

export async function resetStaffAccountPassword(formData: FormData): Promise<{ success: true } | { error: string }> {
  const { authorized, session } = await requireControlPlaneAccess();
  if (!authorized || !session?.user) return { error: "Forbidden" };
  const parsed = z.object({ userId: z.string().cuid(), password: z.string().min(8).max(128) }).safeParse({ userId: formData.get("userId"), password: formData.get("password") });
  if (!parsed.success) return { error: "Password must be between 8 and 128 characters" };
  const user = await getRegularStaffAccount(parsed.data.userId);
  if (!user) return { error: "This protected or invalid account cannot be changed" };
  const password = await bcrypt.hash(parsed.data.password, 12);
  await prisma.user.update({ where: { id: user.id }, data: { password, sessionVersion: { increment: 1 } } });
  await logAction({ userId: session.user.id, action: "STAFF_PASSWORD_RESET", entity: "User", entityId: user.id });
  return { success: true };
}

export async function updateStaffRole(formData: FormData): Promise<{ success: true } | { error: string }> {
  const { authorized, session } = await requireControlPlaneAccess();
  if (!authorized || !session?.user) return { error: "Forbidden" };
  const parsed = z.object({ roleId: z.string().cuid(), name: z.string().trim().min(3).max(80), description: z.string().trim().max(240).optional() }).safeParse({ roleId: formData.get("roleId"), name: formData.get("name"), description: formData.get("description") });
  if (!parsed.success) return { error: "Invalid role" };
  if (!(await getRegularStaffRole(parsed.data.roleId))) return { error: "This protected or invalid role cannot be changed" };
  try {
    await prisma.role.update({ where: { id: parsed.data.roleId }, data: { name: parsed.data.name, description: parsed.data.description || null } });
  } catch {
    return { error: "A role with that name already exists" };
  }
  await logAction({ userId: session.user.id, action: "STAFF_ROLE_UPDATE", entity: "Role", entityId: parsed.data.roleId, metadata: { name: parsed.data.name } });
  revalidateTag("staff", "default");
  return { success: true };
}

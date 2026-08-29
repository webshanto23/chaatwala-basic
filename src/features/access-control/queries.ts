import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/authorize";

export async function getStaffAccessData() {
  const { authorized } = await requireSuperAdmin();
  if (!authorized) return { error: "Forbidden" as const };
  const data = await unstable_cache(async () => Promise.all([
    prisma.role.findMany({ where: { workspace: "STAFF", isSystem: false }, select: { id: true, name: true, description: true, permissions: { select: { permission: { select: { id: true, name: true } } } } }, orderBy: { name: "asc" } }),
    prisma.permission.findMany({ select: { id: true, name: true, description: true }, orderBy: { name: "asc" } }),
    prisma.store.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { staffRole: { workspace: "STAFF", isSystem: false } }, select: { id: true, name: true, username: true, isActive: true, staffRole: { select: { id: true, name: true } }, storeAccess: { select: { store: { select: { id: true, name: true } }, isPrimary: true } } }, orderBy: { createdAt: "desc" } }),
  ]), ["staff-access"], { revalidate: 60, tags: ["staff"] })();
  return { roles: data[0], permissions: data[1], stores: data[2], staff: data[3] };
}

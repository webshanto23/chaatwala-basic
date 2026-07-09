"use server";

import { authorize } from "@/lib/authorize";
import prisma from "@/lib/prisma";

export async function getAuditLogs(filters?: { userId?: string; action?: string; entity?: string; limit?: number }) {
  const { authorized } = await authorize({ permissions: ["audit:view"] });
  if (!authorized) {
    return { error: "Forbidden" };
  }

  const where: Record<string, unknown> = {};

  if (filters?.userId) where.userId = filters.userId;
  if (filters?.action) where.action = filters.action;
  if (filters?.entity) where.entity = filters.entity;

  const logs = await prisma.auditLog.findMany({
    where,
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: filters?.limit ?? 100,
  });

  return { logs };
}

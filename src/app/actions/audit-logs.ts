"use server";

import { authorize } from "@/lib/authorize";
import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";

export async function getAuditLogs(filters?: { userId?: string; action?: string; entity?: string; limit?: number; cursor?: string }) {
  const { authorized } = await authorize({ permissions: ["audit:view"] });
  if (!authorized) {
    return { error: "Forbidden" };
  }

  const where: Record<string, unknown> = {};

  if (filters?.userId) where.userId = filters.userId;
  if (filters?.action) where.action = filters.action;
  if (filters?.entity) where.entity = filters.entity;

  const take = filters?.limit ?? 20;
  const cursor = filters?.cursor ? { id: filters.cursor } : undefined;

  const logs = await unstable_cache(
    async () => {
      const result = await prisma.auditLog.findMany({
        where,
        select: { id: true, action: true, entity: true, entityId: true, metadata: true, createdAt: true, userId: true },
        orderBy: { createdAt: "desc" },
        take,
        ...(cursor ? { skip: 1, cursor } : {}),
      });
      return result;
    },
    ["admin-audit-logs", filters?.action ?? "all", filters?.entity ?? "all", String(take), filters?.cursor ?? "start"],
    { revalidate: 60, tags: ["audit-logs"] }
  )();

  const users = await prisma.user.findMany({
  where: { id: { in: logs.map((l) => l.userId).filter(Boolean) } },
  select: { id: true, name: true, email: true },
});

const userMap = new Map(users.map((u) => [u.id, u]));

const nextCursor = logs.length === take ? logs[logs.length - 1].id : null;

return {
  logs: logs.map((log) => ({
    id: log.id,
    action: log.action,
    entity: log.entity,
    entityId: log.entityId,
    metadata: log.metadata,
    createdAt: log.createdAt,
    user: log.userId
      ? { name: userMap.get(log.userId)?.name ?? null, email: userMap.get(log.userId)?.email ?? null }
      : null,
  })),
  nextCursor,
};
}

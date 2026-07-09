"use server";

import prisma from "@/lib/prisma";

type AuditLogInput = {
  userId: string;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function logAction({ userId, action, entity, entityId, metadata }: AuditLogInput) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      entity,
      entityId: entityId ?? null,
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
    },
  });
}

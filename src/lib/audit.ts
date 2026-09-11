import { prisma } from "@/lib/prisma";
import type * as Prisma from "@/generated/prisma/internal/prismaNamespace";

export async function logAudit(
  actorId: string | null,
  action: string,
  entity: string,
  entityId?: string,
  metadata?: Prisma.InputJsonValue
) {
  await prisma.auditLog.create({
    data: { actorId, action, entity, entityId, metadata },
  });
}

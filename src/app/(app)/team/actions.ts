"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function postRemark(goalId: string, text: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "MANAGER") throw new Error("Not authorized");
  if (!text.trim()) return;

  const goal = await prisma.goal.findUnique({ where: { id: goalId }, include: { owner: true } });
  if (!goal) throw new Error("Goal not found");
  if (goal.owner.managerId !== session.user.id) throw new Error("Not your direct report's goal");

  await prisma.remark.create({
    data: { goalId, authorId: session.user.id, text: text.trim() },
  });

  await logAudit(session.user.id, "Posted remark", "Goal", goalId, { owner: goal.ownerId });
  revalidatePath("/team");
}

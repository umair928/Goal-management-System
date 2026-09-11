"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import type { Category, GoalStatus } from "@/generated/prisma/enums";

export type KeyResultInput = {
  description: string;
  unit: string;
  current: number;
  target: number;
};

export type GoalInput = {
  title: string;
  description: string;
  category: Category;
  status: GoalStatus;
  confidence: number;
  keyResults: KeyResultInput[];
};

function sanitizeKeyResults(keyResults: KeyResultInput[]) {
  return keyResults
    .filter((kr) => kr.description.trim().length > 0)
    .map((kr, order) => ({
      description: kr.description.trim(),
      unit: kr.unit.trim(),
      current: Number.isFinite(kr.current) ? kr.current : 0,
      target: Number.isFinite(kr.target) ? kr.target : 0,
      order,
    }));
}

export async function createGoal(quarterId: string, input: GoalInput) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const quarter = await prisma.quarter.findUnique({ where: { id: quarterId } });
  if (!quarter) throw new Error("Quarter not found");
  if (quarter.locked) throw new Error("This quarter is locked");

  const goal = await prisma.goal.create({
    data: {
      ownerId: session.user.id,
      quarterId,
      title: input.title.trim() || "Untitled goal",
      description: input.description.trim(),
      category: input.category,
      status: input.status,
      confidence: input.confidence,
      keyResults: { create: sanitizeKeyResults(input.keyResults) },
    },
  });

  await logAudit(session.user.id, "Created goal", "Goal", goal.id, { title: goal.title });
  revalidatePath("/goals");
  return { id: goal.id };
}

export async function updateGoal(goalId: string, input: GoalInput) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const goal = await prisma.goal.findUnique({ where: { id: goalId }, include: { quarter: true } });
  if (!goal) throw new Error("Goal not found");
  if (goal.ownerId !== session.user.id) throw new Error("You can only edit your own goals");
  if (goal.quarter.locked) throw new Error("This quarter is locked");

  await prisma.keyResult.deleteMany({ where: { goalId } });
  await prisma.goal.update({
    where: { id: goalId },
    data: {
      title: input.title.trim() || "Untitled goal",
      description: input.description.trim(),
      category: input.category,
      status: input.status,
      confidence: input.confidence,
      keyResults: { create: sanitizeKeyResults(input.keyResults) },
    },
  });

  await logAudit(session.user.id, "Edited goal", "Goal", goalId, { title: input.title });
  revalidatePath("/goals");
}

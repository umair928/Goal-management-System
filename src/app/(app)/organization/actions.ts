"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import type { Role } from "@/generated/prisma/enums";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Admin access required");
  return session.user;
}

export async function updateUserRole(userId: string, role: Role) {
  const admin = await requireAdmin();
  const user = await prisma.user.update({ where: { id: userId }, data: { role } });
  await logAudit(admin.id, "Changed role", "User", userId, { name: user.name, role });
  revalidatePath("/organization");
}

export async function updateUserAssignment(
  userId: string,
  data: { designation: string; department: string; accessLevel: string; managerId: string | null }
) {
  const admin = await requireAdmin();
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      designation: data.designation.trim() || null,
      department: data.department.trim() || null,
      accessLevel: data.accessLevel.trim() || null,
      managerId: data.managerId || null,
    },
  });
  await logAudit(admin.id, "Updated assignment", "User", userId, { name: user.name });
  revalidatePath("/organization");
}

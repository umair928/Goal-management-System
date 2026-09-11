import type { Role } from "@/generated/prisma/enums";

export const ROLE_LABELS: Record<Role, string> = {
  EMPLOYEE: "Employee",
  MANAGER: "Manager",
  CEO: "CEO",
  ADMIN: "Admin",
};

export function canSeeTeam(role: Role) {
  return role === "MANAGER";
}

export function canSeeOrganization(role: Role) {
  return role === "CEO" || role === "ADMIN";
}

export function canEditUsers(role: Role) {
  return role === "ADMIN";
}

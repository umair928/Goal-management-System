"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { Role } from "@/generated/prisma/enums";
import { ROLE_LABELS } from "@/lib/roles";
import { updateUserRole } from "./actions";

const ROLES: Role[] = ["EMPLOYEE", "MANAGER", "CEO", "ADMIN"];

export function RoleSelect({ userId, role }: { userId: string; role: Role }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <select
      defaultValue={role}
      disabled={isPending}
      onChange={(e) => {
        const next = e.target.value as Role;
        startTransition(async () => {
          await updateUserRole(userId, next);
          router.refresh();
        });
      }}
      className="w-full px-2.5 py-1.5 border border-border-strong bg-surface-alt text-[12px] rounded-md"
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {ROLE_LABELS[r]}
        </option>
      ))}
    </select>
  );
}

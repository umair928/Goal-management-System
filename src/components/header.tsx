import Image from "next/image";
import { signOut } from "@/lib/auth";
import { QuarterSwitcher } from "@/components/quarter-switcher";
import { NavTabs } from "@/components/nav-tabs";
import { ROLE_LABELS, canSeeOrganization, canSeeTeam } from "@/lib/session";
import { initialsFor } from "@/lib/status";
import type { Role } from "@/generated/prisma/enums";

export function Header({
  user,
  quarters,
  defaultLabel,
}: {
  user: { name?: string | null; email?: string | null; image?: string | null; role: Role };
  quarters: { label: string; locked: boolean }[];
  defaultLabel: string;
}) {
  const tabs = [{ href: "/goals", label: "My goals" }];
  if (canSeeTeam(user.role)) tabs.push({ href: "/team", label: "My team" });
  if (canSeeOrganization(user.role)) tabs.push({ href: "/organization", label: "Organization" });
  tabs.push({ href: "/profile", label: "My profile" });

  async function doSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <header className="flex items-center justify-between flex-wrap gap-3.5 px-6 py-[13px] border-b border-border sticky top-0 z-10 bg-surface-alt">
      <div className="flex items-center gap-2.5">
        <Image src="/logo.png" alt="Purely Works" width={118} height={32} className="block h-auto w-[118px]" />
        <div className="w-px h-5 bg-border" />
        <div className="font-heading text-[11px] tracking-[0.12em] uppercase font-bold text-chambray">
          Quarterly Goals
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        <QuarterSwitcher quarters={quarters} defaultLabel={defaultLabel} />
        <NavTabs tabs={tabs} />

        <div className="flex items-center gap-2.5 pl-2.5 border-l border-border-soft">
          <div className="w-[27px] h-[27px] bg-border rounded-full grid place-items-center font-heading text-[10px]">
            {initialsFor(user.name, user.email ?? "")}
          </div>
          <div>
            <div className="text-[12px]">{user.name ?? user.email}</div>
            <div className="font-heading text-[9px] tracking-[0.1em] uppercase text-muted">
              {ROLE_LABELS[user.role]}
            </div>
          </div>
          <form action={doSignOut}>
            <button type="submit" className="bg-transparent border-none text-[11px] text-faint cursor-pointer pl-1.5">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

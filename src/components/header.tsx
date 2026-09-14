import Image from "next/image";
import { signOut } from "@/lib/auth";
import { QuarterSwitcher } from "@/components/quarter-switcher";
import { NavTabs } from "@/components/nav-tabs";
import { ROLE_LABELS, canSeeOrganization, canSeeTeam } from "@/lib/session";
import { initialsFor } from "@/lib/status";
import type { Role } from "@/generated/prisma/enums";
import styles from "./header.module.css";

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
    <header className={styles.header}>
      <div className={styles.brand}>
        <Image src="/logo.png" alt="Purely Works" width={118} height={32} className={styles.logo} />
        <div className={styles.divider} />
        <div className={styles.wordmark}>Quarterly Goals</div>
      </div>

      <div className={styles.controls}>
        <QuarterSwitcher quarters={quarters} defaultLabel={defaultLabel} />
        <NavTabs tabs={tabs} />

        <div className={styles.account}>
          <div className={styles.avatar}>{initialsFor(user.name, user.email ?? "")}</div>
          <div>
            <div className={styles.name}>{user.name ?? user.email}</div>
            <div className={styles.role}>{ROLE_LABELS[user.role]}</div>
          </div>
          <form action={doSignOut}>
            <button type="submit" className={styles.signOut}>
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

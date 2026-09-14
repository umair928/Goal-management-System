"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import styles from "./nav-tabs.module.css";

export function NavTabs({ tabs }: { tabs: { href: string; label: string }[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const q = searchParams.get("q");
  const suffix = q ? `?q=${encodeURIComponent(q)}` : "";

  return (
    <div className={styles.row}>
      {tabs.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={`${t.href}${suffix}`}
            className={`${styles.tab} ${active ? styles.tabActive : ""}`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export function NavTabs({ tabs }: { tabs: { href: string; label: string }[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const q = searchParams.get("q");
  const suffix = q ? `?q=${encodeURIComponent(q)}` : "";

  return (
    <div className="flex items-center gap-1">
      {tabs.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={`${t.href}${suffix}`}
            className={`px-3 py-[7px] font-heading text-[11px] tracking-[0.04em] rounded-md no-underline ${
              active ? "bg-chambray text-white" : "bg-transparent text-ink"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}

"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import styles from "./audit-search.module.css";

export function AuditSearch({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <input
      defaultValue={defaultValue}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams.toString());
        if (e.target.value) params.set("aq", e.target.value);
        else params.delete("aq");
        router.replace(`${pathname}?${params.toString()}`);
      }}
      placeholder="Search actor, action or entity…"
      className={styles.input}
    />
  );
}

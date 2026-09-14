"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import styles from "./quarter-switcher.module.css";

export function QuarterSwitcher({
  quarters,
  defaultLabel,
}: {
  quarters: { label: string; locked: boolean }[];
  defaultLabel: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selected = searchParams.get("q") || defaultLabel;
  const current = quarters.find((q) => q.label === selected);

  function onChange(label: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("q", label);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className={styles.row}>
      <select value={selected} onChange={(e) => onChange(e.target.value)} className={styles.select}>
        {quarters.map((q) => (
          <option key={q.label} value={q.label}>
            {q.label}
          </option>
        ))}
      </select>
      {current?.locked && <div className={styles.locked}>Locked</div>}
    </div>
  );
}

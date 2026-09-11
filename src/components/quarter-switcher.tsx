"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

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
    <div className="flex items-center gap-2.5">
      <select
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        className="px-2.5 py-[7px] border border-border-strong rounded-md bg-card font-heading text-[11px] tracking-[0.06em]"
      >
        {quarters.map((q) => (
          <option key={q.label} value={q.label}>
            {q.label}
          </option>
        ))}
      </select>
      {current?.locked && (
        <div className="font-heading text-[10px] tracking-[0.08em] uppercase px-2.5 py-1.5 rounded-full bg-border-soft text-chambray">
          Locked
        </div>
      )}
    </div>
  );
}

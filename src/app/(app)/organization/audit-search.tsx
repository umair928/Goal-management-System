"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

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
      className="flex-1 min-w-[200px] px-2.5 py-2 border border-border-strong rounded-md bg-surface-alt text-[13px]"
    />
  );
}

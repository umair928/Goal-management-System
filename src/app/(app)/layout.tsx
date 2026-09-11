import { requireSession } from "@/lib/session";
import { ensureCurrentQuarterExists, listQuarters } from "@/lib/quarters";
import { Header } from "@/components/header";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const current = await ensureCurrentQuarterExists();
  const quarters = await listQuarters();

  return (
    <div>
      <Header
        user={session.user}
        quarters={quarters.map((q) => ({ label: q.label, locked: q.locked }))}
        defaultLabel={current.label}
      />
      <div className="px-6 pt-[26px] pb-[72px]">{children}</div>
    </div>
  );
}

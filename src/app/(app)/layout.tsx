import { requireSession } from "@/lib/session";
import { ensureCurrentQuarterExists, listQuarters } from "@/lib/quarters";
import { Header } from "@/components/header";
import styles from "./layout.module.css";

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
      <div className={styles.content}>{children}</div>
    </div>
  );
}

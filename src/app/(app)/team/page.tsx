import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { resolveQuarter } from "@/lib/resolve-quarter";
import { prisma } from "@/lib/prisma";
import { CATEGORY_COLORS, CATEGORY_LABELS, STATUS_LABELS, STATUS_STYLE, computeGoalProgress, formatDateTime, initialsFor, pluralize } from "@/lib/status";
import { RemarkComposer } from "./remark-composer";
import styles from "./team.module.css";

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; person?: string }>;
}) {
  const session = await requireSession();
  if (session.user.role !== "MANAGER") redirect("/goals");

  const params = await searchParams;
  const quarter = await resolveQuarter(params.q);

  const reports = await prisma.user.findMany({
    where: { managerId: session.user.id },
    orderBy: { name: "asc" },
    include: {
      goals: {
        where: { quarterId: quarter.id },
        include: { keyResults: true },
      },
    },
  });

  const roster = reports.map((r) => {
    const avg =
      r.goals.length === 0
        ? null
        : Math.round(r.goals.reduce((sum, g) => sum + computeGoalProgress(g.keyResults), 0) / r.goals.length);
    const atRisk = r.goals.some((g) => g.status === "AT_RISK");
    return { ...r, avg, atRisk };
  });

  const selectedId = params.person && roster.some((r) => r.id === params.person) ? params.person : roster[0]?.id;
  const selected = roster.find((r) => r.id === selectedId) ?? null;

  const selectedGoals = selected
    ? await prisma.goal.findMany({
        where: { ownerId: selected.id, quarterId: quarter.id },
        include: {
          keyResults: { orderBy: { order: "asc" } },
          remarks: { include: { author: { select: { name: true, email: true } } }, orderBy: { createdAt: "asc" } },
        },
        orderBy: { createdAt: "asc" },
      })
    : [];

  const qParam = `q=${encodeURIComponent(quarter.label)}`;

  return (
    <div className={styles.page}>
      <aside className={styles.roster}>
        <div className={styles.rosterHead}>Direct reports</div>
        {roster.length === 0 && <div className={styles.rosterEmpty}>No direct reports yet.</div>}
        {roster.map((r) => (
          <Link
            key={r.id}
            href={`/team?${qParam}&person=${r.id}`}
            className={styles.rosterItem}
            style={{
              borderLeft: `3px solid ${r.atRisk ? "#A8412C" : "transparent"}`,
              background: r.id === selectedId ? "#F5F7FA" : "transparent",
            }}
          >
            <span className={styles.rosterAvatar}>{initialsFor(r.name, r.email)}</span>
            <span className={styles.rosterInfo}>
              <span className={styles.rosterName}>{r.name ?? r.email}</span>
              <span className={styles.rosterMeta}>
                {pluralize(r.goals.length, "goal")} · {r.avg === null ? "—" : `${r.avg}%`}
              </span>
            </span>
            <span className={styles.rosterFlag} style={{ color: r.atRisk ? "#A8412C" : "transparent" }}>
              {r.atRisk ? "At risk" : ""}
            </span>
          </Link>
        ))}
      </aside>

      <div className={styles.detail}>
        {selected ? (
          <>
            <div className={styles.detailHead}>
              <h1 className={styles.detailTitle}>{selected.name ?? selected.email}</h1>
              <div className={styles.detailMeta}>
                {selected.avg === null ? "—" : `${selected.avg}%`} complete · {quarter.label} · review only
              </div>
            </div>

            {selectedGoals.length === 0 && (
              <div className={styles.emptyState}>No goals recorded for {quarter.label}.</div>
            )}

            {selectedGoals.map((g) => {
              const pct = computeGoalProgress(g.keyResults);
              const style = STATUS_STYLE[g.status];
              const firstName = (selected.name ?? selected.email).split(" ")[0];
              return (
                <article key={g.id} className={styles.goalCard}>
                  <div className={styles.goalTop}>
                    <div className={styles.categoryRow}>
                      <span className={styles.categoryDot} style={{ background: CATEGORY_COLORS[g.category] }} />
                      <span className={styles.categoryLabel}>{CATEGORY_LABELS[g.category]}</span>
                    </div>
                    <div className={styles.goalTitle}>{g.title}</div>
                    {g.description && <div className={styles.goalDescription}>{g.description}</div>}
                    <div>
                      <div className={styles.progressTrack}>
                        <div className={styles.progressFill} style={{ width: `${pct}%`, background: style.bar }} />
                      </div>
                      <div className={styles.progressMeta}>
                        <span>{pluralize(g.keyResults.length, "key result")}</span>
                        <span>{pct}%</span>
                      </div>
                    </div>
                    <div className={styles.badgeRow}>
                      <span className={styles.statusPill} style={{ background: style.bg, color: style.fg }}>
                        {STATUS_LABELS[g.status]}
                      </span>
                      <span className={styles.confidencePill}>Confidence {g.confidence}/10</span>
                    </div>
                  </div>

                  <div className={styles.remarksBox}>
                    <div className={styles.remarksHead}>Remarks</div>
                    {g.remarks.map((rm) => (
                      <div key={rm.text + rm.createdAt.toISOString()} className={styles.remarkItem}>
                        <div className={styles.remarkMeta}>
                          {rm.author.name ?? rm.author.email} · {formatDateTime(rm.createdAt)}
                        </div>
                        <div className={styles.remarkText}>{rm.text}</div>
                      </div>
                    ))}
                    <RemarkComposer goalId={g.id} firstName={firstName} />
                  </div>
                </article>
              );
            })}
          </>
        ) : (
          <div className={styles.emptyState}>No direct reports to review yet.</div>
        )}
      </div>
    </div>
  );
}

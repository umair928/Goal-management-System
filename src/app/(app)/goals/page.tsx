import { requireSession } from "@/lib/session";
import { resolveQuarter } from "@/lib/resolve-quarter";
import { prisma } from "@/lib/prisma";
import { CATEGORY_LABELS, CATEGORY_COLORS, computeGoalProgress, pluralize } from "@/lib/status";
import { GoalCard } from "@/components/goal-card";
import { StopPropagationLink } from "@/components/stop-propagation-link";
import { GoalModal } from "./goal-modal";
import type { Category } from "@/generated/prisma/enums";
import styles from "./goals.module.css";

const CATEGORY_ORDER: Category[] = ["INDIVIDUAL", "TEAM", "ORGANIZATIONAL"];

export default async function GoalsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; new?: string; edit?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const quarter = await resolveQuarter(params.q);

  const goals = await prisma.goal.findMany({
    where: { ownerId: session.user.id, quarterId: quarter.id },
    include: {
      keyResults: { orderBy: { order: "asc" } },
      remarks: { include: { author: { select: { name: true, email: true } } }, orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "asc" },
  });

  const closeHref = `/goals?q=${encodeURIComponent(quarter.label)}`;

  let modal: React.ReactNode = null;
  if (!quarter.locked && params.new) {
    const category = CATEGORY_ORDER.includes(params.new as Category) ? (params.new as Category) : "INDIVIDUAL";
    modal = (
      <GoalModal
        mode="create"
        quarterId={quarter.id}
        locked={quarter.locked}
        closeHref={closeHref}
        initial={{
          title: "",
          description: "",
          category,
          status: "NOT_STARTED",
          confidence: 5,
          keyResults: [{ description: "", unit: "", current: 0, target: 0 }],
        }}
      />
    );
  } else if (params.edit) {
    const goal = goals.find((g) => g.id === params.edit);
    if (goal) {
      modal = (
        <GoalModal
          mode="edit"
          quarterId={quarter.id}
          goalId={goal.id}
          locked={quarter.locked}
          closeHref={closeHref}
          initial={{
            title: goal.title,
            description: goal.description ?? "",
            category: goal.category,
            status: goal.status,
            confidence: goal.confidence,
            keyResults: goal.keyResults.map((kr) => ({
              description: kr.description,
              unit: kr.unit ?? "",
              current: kr.current,
              target: kr.target,
            })),
          }}
        />
      );
    }
  }

  const totalCount = goals.length;
  const totalAvg =
    totalCount === 0 ? "—" : `${Math.round(goals.reduce((sum, g) => sum + computeGoalProgress(g.keyResults), 0) / totalCount)}%`;

  return (
    <div className={styles.page}>
      <div className={styles.pageHead}>
        <h1 className={styles.pageTitle}>My goals</h1>
        <div className={styles.pageSummary}>
          {quarter.label} · {pluralize(totalCount, "goal")} · {totalAvg} average completion
          {quarter.locked ? " · archived, read-only" : ""}
        </div>
      </div>

      {CATEGORY_ORDER.map((category) => {
        const sectionGoals = goals.filter((g) => g.category === category);
        const avg =
          sectionGoals.length === 0
            ? "—"
            : `${Math.round(
                sectionGoals.reduce((sum, g) => sum + computeGoalProgress(g.keyResults), 0) / sectionGoals.length
              )}%`;

        return (
          <details key={category} open className={styles.section}>
            <summary className={styles.sectionHead}>
              <div className={styles.sectionHeadLeft}>
                <span className={styles.sectionDot} style={{ background: CATEGORY_COLORS[category] }} />
                <span className={styles.sectionLabel}>{CATEGORY_LABELS[category]}</span>
                <span className={styles.sectionMeta}>
                  {pluralize(sectionGoals.length, "goal")} · {avg} avg
                </span>
              </div>
              {!quarter.locked && (
                <StopPropagationLink
                  href={`/goals?q=${encodeURIComponent(quarter.label)}&new=${category}`}
                  className={styles.newGoalLink}
                >
                  + New goal
                </StopPropagationLink>
              )}
            </summary>

            <div className={styles.sectionBody}>
              {sectionGoals.length === 0 ? (
                <div className={styles.emptyState}>No {CATEGORY_LABELS[category].toLowerCase()} goals this quarter yet.</div>
              ) : (
                sectionGoals.map((g) => (
                  <GoalCard
                    key={g.id}
                    goal={g}
                    editHref={`/goals?q=${encodeURIComponent(quarter.label)}&edit=${g.id}`}
                  />
                ))
              )}
            </div>
          </details>
        );
      })}

      {modal}
    </div>
  );
}

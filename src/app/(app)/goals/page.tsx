import { requireSession } from "@/lib/session";
import { resolveQuarter } from "@/lib/resolve-quarter";
import { prisma } from "@/lib/prisma";
import { CATEGORY_LABELS, CATEGORY_COLORS, computeGoalProgress, pluralize } from "@/lib/status";
import { GoalCard } from "@/components/goal-card";
import { StopPropagationLink } from "@/components/stop-propagation-link";
import { GoalModal } from "./goal-modal";
import type { Category } from "@/generated/prisma/enums";

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
    <div className="max-w-[1100px] mx-auto grid gap-[18px]">
      <div className="flex items-baseline justify-between flex-wrap gap-2.5">
        <h1 className="font-heading font-semibold text-[19px] m-0 tracking-tight">My goals</h1>
        <div className="font-heading text-[11px] text-muted tracking-[0.04em]">
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
          <details key={category} open className="bg-card border border-border rounded-[10px]">
            <summary className="flex items-center justify-between flex-wrap gap-3 px-[18px] py-3.5 border-b border-border-soft cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: CATEGORY_COLORS[category] }} />
                <span className="font-heading text-[11px] tracking-[0.1em] uppercase">{CATEGORY_LABELS[category]}</span>
                <span className="font-heading text-[11px] text-muted">
                  {pluralize(sectionGoals.length, "goal")} · {avg} avg
                </span>
              </div>
              {!quarter.locked && (
                <StopPropagationLink
                  href={`/goals?q=${encodeURIComponent(quarter.label)}&new=${category}`}
                  className="px-3 py-1.5 border border-border-strong rounded-lg bg-surface-alt text-chambray font-heading text-[10px] tracking-[0.08em] uppercase no-underline"
                >
                  + New goal
                </StopPropagationLink>
              )}
            </summary>

            <div className="flex flex-wrap gap-3.5 p-4">
              {sectionGoals.length === 0 ? (
                <div className="flex-1 basis-full p-[18px] border border-dashed border-border-strong rounded-[10px] text-[13px] text-muted">
                  No {CATEGORY_LABELS[category].toLowerCase()} goals this quarter yet.
                </div>
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

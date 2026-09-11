import Link from "next/link";
import { CATEGORY_COLORS, CATEGORY_LABELS, STATUS_LABELS, STATUS_STYLE, computeGoalProgress, pluralize, formatDateTime } from "@/lib/status";
import type { Category, GoalStatus } from "@/generated/prisma/enums";

export type GoalCardData = {
  id: string;
  title: string;
  category: Category;
  status: GoalStatus;
  confidence: number;
  keyResults: { current: number; target: number }[];
  remarks: { author: { name: string | null; email: string }; text: string; createdAt: Date }[];
};

export function GoalCard({
  goal,
  editHref,
}: {
  goal: GoalCardData;
  /** Omit to render a read-only card (no Edit control) — used by the Manager view. */
  editHref?: string;
}) {
  const pct = computeGoalProgress(goal.keyResults);
  const style = STATUS_STYLE[goal.status];

  return (
    <article className="flex-1 basis-[300px] min-w-0 bg-card border border-border rounded-[10px] p-[18px] grid gap-3 content-start">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="w-2 h-2 rounded-[3px]" style={{ background: CATEGORY_COLORS[goal.category] }} />
            <span className="font-heading text-[9px] tracking-[0.1em] uppercase text-muted">
              {CATEGORY_LABELS[goal.category]}
            </span>
          </div>
          <div className="font-heading font-semibold text-[15px] leading-[1.35]" style={{ textWrap: "pretty" }}>
            {goal.title}
          </div>
        </div>
        {editHref && (
          <Link
            href={editHref}
            title="Edit goal"
            className="flex-shrink-0 px-2.5 py-1.5 border border-border rounded-[10px] bg-surface-alt font-heading text-[10px] text-chambray no-underline"
          >
            Edit
          </Link>
        )}
      </div>

      <div>
        <div className="h-1.5 rounded-[3px] bg-border-soft">
          <div className="h-1.5 rounded-[3px]" style={{ width: `${pct}%`, background: style.bar }} />
        </div>
        <div className="flex justify-between mt-1.5 font-heading text-[10px] text-muted">
          <span>{pluralize(goal.keyResults.length, "key result")}</span>
          <span>{pct}%</span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="font-heading text-[9px] tracking-[0.08em] uppercase px-2 py-1 rounded-full"
          style={{ background: style.bg, color: style.fg }}
        >
          {STATUS_LABELS[goal.status]}
        </span>
        <span
          title="Confidence score"
          className="font-heading text-[10px] px-2 py-1 border border-border-strong rounded-full text-chambray"
        >
          Confidence {goal.confidence}/10
        </span>
      </div>

      {goal.remarks.length > 0 && (
        <details className="border-t border-border-softer pt-3 group">
          <summary className="flex items-center gap-2 w-full text-left px-2.5 py-2 border border-dashed border-border-input rounded-lg bg-surface-alt cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            <span className="font-heading text-[9px] tracking-[0.08em] uppercase text-muted">Read-only</span>
            <span className="text-[12px] text-ink">
              {pluralize(goal.remarks.length, "remark")} from {goal.remarks[0].author.name ?? goal.remarks[0].author.email}
            </span>
            <span className="ml-auto font-heading text-[11px] text-faint group-open:hidden">+</span>
            <span className="ml-auto font-heading text-[11px] text-faint hidden group-open:inline">-</span>
          </summary>
          <div className="border border-dashed border-border-input border-t-0 rounded-lg rounded-t-none bg-surface-alt px-3 pt-3 pb-[13px]">
            {goal.remarks.map((rm, i) => (
              <div key={i} className="mb-2.5">
                <div className="font-heading text-[9px] tracking-[0.06em] text-muted mb-1">
                  {rm.author.name ?? rm.author.email} · {formatDateTime(rm.createdAt)}
                </div>
                <div className="text-[12px] leading-relaxed text-ink">{rm.text}</div>
              </div>
            ))}
            <div className="font-heading text-[9px] text-faint tracking-[0.06em]">
              Manager remarks cannot be edited or removed by you.
            </div>
          </div>
        </details>
      )}
    </article>
  );
}

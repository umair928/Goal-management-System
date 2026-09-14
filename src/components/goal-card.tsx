import Link from "next/link";
import { CATEGORY_COLORS, CATEGORY_LABELS, STATUS_LABELS, STATUS_STYLE, computeGoalProgress, pluralize, formatDateTime } from "@/lib/status";
import type { Category, GoalStatus } from "@/generated/prisma/enums";
import styles from "./goal-card.module.css";

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
    <article className={styles.card}>
      <div className={styles.head}>
        <div className={styles.titleBlock}>
          <div className={styles.categoryRow}>
            <span className={styles.categoryDot} style={{ background: CATEGORY_COLORS[goal.category] }} />
            <span className={styles.categoryLabel}>{CATEGORY_LABELS[goal.category]}</span>
          </div>
          <div className={styles.title}>{goal.title}</div>
        </div>
        {editHref && (
          <Link href={editHref} title="Edit goal" className={styles.editLink}>
            Edit
          </Link>
        )}
      </div>

      <div>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${pct}%`, background: style.bar }} />
        </div>
        <div className={styles.progressMeta}>
          <span>{pluralize(goal.keyResults.length, "key result")}</span>
          <span>{pct}%</span>
        </div>
      </div>

      <div className={styles.badgeRow}>
        <span className={styles.statusPill} style={{ background: style.bg, color: style.fg }}>
          {STATUS_LABELS[goal.status]}
        </span>
        <span title="Confidence score" className={styles.confidencePill}>
          Confidence {goal.confidence}/10
        </span>
      </div>

      {goal.remarks.length > 0 && (
        <details className={styles.remarksDetails}>
          <summary className={styles.remarksSummary}>
            <span className={styles.remarksReadOnly}>Read-only</span>
            <span className={styles.remarksChip}>
              {pluralize(goal.remarks.length, "remark")} from {goal.remarks[0].author.name ?? goal.remarks[0].author.email}
            </span>
            <span className={styles.caretPlus}>+</span>
            <span className={styles.caretMinus}>-</span>
          </summary>
          <div className={styles.remarksBody}>
            {goal.remarks.map((rm, i) => (
              <div key={i} className={styles.remarkItem}>
                <div className={styles.remarkMeta}>
                  {rm.author.name ?? rm.author.email} · {formatDateTime(rm.createdAt)}
                </div>
                <div className={styles.remarkText}>{rm.text}</div>
              </div>
            ))}
            <div className={styles.remarksFootnote}>Manager remarks cannot be edited or removed by you.</div>
          </div>
        </details>
      )}
    </article>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Category, GoalStatus } from "@/generated/prisma/enums";
import { createGoal, updateGoal, type GoalInput, type KeyResultInput } from "./actions";
import styles from "./goal-modal.module.css";

type Draft = {
  title: string;
  description: string;
  category: Category;
  status: GoalStatus;
  confidence: number;
  keyResults: KeyResultInput[];
};

export function GoalModal({
  mode,
  quarterId,
  goalId,
  initial,
  locked,
  closeHref,
}: {
  mode: "create" | "edit";
  quarterId: string;
  goalId?: string;
  initial: Draft;
  locked: boolean;
  closeHref: string;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(initial);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function close() {
    router.push(closeHref);
  }

  function save() {
    setError(null);
    const input: GoalInput = draft;
    startTransition(async () => {
      try {
        if (mode === "create") {
          await createGoal(quarterId, input);
        } else if (goalId) {
          await updateGoal(goalId, input);
        }
        router.push(closeHref);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  function updateKr(index: number, patch: Partial<KeyResultInput>) {
    setDraft((d) => ({
      ...d,
      keyResults: d.keyResults.map((kr, i) => (i === index ? { ...kr, ...patch } : kr)),
    }));
  }

  function addKr() {
    setDraft((d) => ({
      ...d,
      keyResults: [...d.keyResults, { description: "", unit: "", current: 0, target: 0 }],
    }));
  }

  function removeKr(index: number) {
    setDraft((d) => ({ ...d, keyResults: d.keyResults.filter((_, i) => i !== index) }));
  }

  const fieldBg = locked ? "#F2F4F8" : "#F9FAFC";
  const disabled = locked || isPending;

  return (
    <div className={styles.overlay} onClick={close}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>{mode === "create" ? "New goal" : "Edit goal"}</div>
          <button onClick={close} className={styles.closeButton}>
            ×
          </button>
        </div>

        {locked && (
          <div className={styles.lockedBanner}>
            <span className={styles.lockedDot} />
            <span className={styles.lockedText}>This quarter is locked.</span>
            <span className={styles.lockedTag}>Read-only</span>
          </div>
        )}

        <div className={styles.body}>
          <div>
            <label htmlFor="goal-title" className={styles.field}>
              Title
            </label>
            <input
              id="goal-title"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              disabled={disabled}
              placeholder="What will be true by the end of the quarter?"
              className={styles.input}
              style={{ background: fieldBg }}
            />
          </div>
          <div>
            <label htmlFor="goal-description" className={styles.field}>
              Description
            </label>
            <textarea
              id="goal-description"
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              disabled={disabled}
              rows={3}
              placeholder="Context for you and your manager."
              className={styles.textarea}
              style={{ background: fieldBg }}
            />
          </div>
          <div className={styles.twoCol}>
            <div>
              <label htmlFor="goal-category" className={styles.field}>
                Category
              </label>
              <select
                id="goal-category"
                value={draft.category}
                onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value as Category }))}
                disabled={disabled}
                className={styles.select}
                style={{ background: fieldBg }}
              >
                <option value="INDIVIDUAL">Individual</option>
                <option value="TEAM">Team</option>
                <option value="ORGANIZATIONAL">Organizational</option>
              </select>
            </div>
            <div>
              <label htmlFor="goal-status" className={styles.field}>
                Status
              </label>
              <select
                id="goal-status"
                value={draft.status}
                onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as GoalStatus }))}
                disabled={disabled}
                className={styles.select}
                style={{ background: fieldBg }}
              >
                <option value="NOT_STARTED">Not started</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="AT_RISK">At risk</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="goal-confidence" className={styles.fieldSpaced}>
              Confidence score — {draft.confidence}/10
            </label>
            <input
              id="goal-confidence"
              type="range"
              min={1}
              max={10}
              step={1}
              value={draft.confidence}
              onChange={(e) => setDraft((d) => ({ ...d, confidence: Number(e.target.value) }))}
              disabled={disabled}
              className={styles.range}
            />
            <div className={styles.rangeLabels}>
              <span>1 · low</span>
              <span>10 · certain</span>
            </div>
          </div>

          <div>
            <div className={styles.krHeadRow}>
              <label className={styles.field} style={{ marginBottom: 0 }}>
                Key results
              </label>
              <span className={styles.krHeadRight}>current / target</span>
            </div>
            <div className={styles.krList}>
              {draft.keyResults.map((kr, i) => (
                <div key={i} className={styles.krRow}>
                  <input
                    value={kr.description}
                    onChange={(e) => updateKr(i, { description: e.target.value })}
                    disabled={disabled}
                    placeholder="Description"
                    className={styles.krInput}
                    style={{ background: fieldBg }}
                  />
                  <input
                    value={kr.current}
                    onChange={(e) => updateKr(i, { current: Number(e.target.value) })}
                    disabled={disabled}
                    type="number"
                    placeholder="Now"
                    className={styles.krInputNumber}
                    style={{ background: fieldBg }}
                  />
                  <input
                    value={kr.unit}
                    onChange={(e) => updateKr(i, { unit: e.target.value })}
                    disabled={disabled}
                    placeholder="Unit"
                    className={styles.krInputNumber}
                    style={{ background: fieldBg }}
                  />
                  <input
                    value={kr.target}
                    onChange={(e) => updateKr(i, { target: Number(e.target.value) })}
                    disabled={disabled}
                    type="number"
                    placeholder="Target"
                    className={styles.krInputNumber}
                    style={{ background: fieldBg }}
                  />
                  <button onClick={() => removeKr(i)} disabled={disabled} title="Remove" className={styles.krRemove}>
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button onClick={addKr} disabled={disabled} className={styles.addKrButton}>
              + Add key result
            </button>
          </div>

          {error && <div className={styles.error}>{error}</div>}
        </div>

        <div className={styles.footer}>
          <button onClick={close} className={styles.cancelButton}>
            Cancel
          </button>
          <button
            onClick={save}
            disabled={disabled}
            className={styles.saveButton}
            style={{ background: locked ? "#9AA5B4" : "#455E7F", cursor: disabled ? "default" : "pointer" }}
          >
            {isPending ? "Saving…" : "Save goal"}
          </button>
        </div>
      </div>
    </div>
  );
}

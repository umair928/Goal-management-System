"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Category, GoalStatus } from "@/generated/prisma/enums";
import { createGoal, updateGoal, type GoalInput, type KeyResultInput } from "./actions";

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
    <div className="fixed inset-0 bg-[rgba(37,50,68,0.45)] grid place-items-center p-6 z-40 overflow-auto" onClick={close}>
      <div
        className="w-full max-w-[620px] bg-card border border-border-input animate-fade-up rounded-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-[22px] py-4 border-b border-border-soft">
          <div className="font-heading text-[11px] tracking-[0.1em] uppercase">
            {mode === "create" ? "New goal" : "Edit goal"}
          </div>
          <button onClick={close} className="bg-transparent border-none text-[18px] text-muted cursor-pointer leading-none">
            ×
          </button>
        </div>

        {locked && (
          <div className="flex items-center gap-2.5 px-[22px] py-3 bg-[#FBF3E0] border-b border-[#EFE0BC]">
            <span className="w-2 h-2 bg-gold" />
            <span className="text-[13px] text-[#4A3F22]">This quarter is locked.</span>
            <span className="font-heading text-[10px] text-muted tracking-[0.06em] ml-auto">Read-only</span>
          </div>
        )}

        <div className="p-[22px] grid gap-[18px] max-h-[62vh] overflow-auto">
          <div>
            <label htmlFor="goal-title" className="block font-heading text-[10px] tracking-[0.12em] uppercase text-muted mb-1.5">
              Title
            </label>
            <input
              id="goal-title"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              disabled={disabled}
              placeholder="What will be true by the end of the quarter?"
              className="w-full px-3 py-[11px] border border-border-input rounded-md text-[14px]"
              style={{ background: fieldBg }}
            />
          </div>
          <div>
            <label htmlFor="goal-description" className="block font-heading text-[10px] tracking-[0.12em] uppercase text-muted mb-1.5">
              Description
            </label>
            <textarea
              id="goal-description"
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              disabled={disabled}
              rows={3}
              placeholder="Context for you and your manager."
              className="w-full px-3 py-[11px] border border-border-input rounded-md text-[13px] resize-y font-[inherit]"
              style={{ background: fieldBg }}
            />
          </div>
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
            <div>
              <label htmlFor="goal-category" className="block font-heading text-[10px] tracking-[0.12em] uppercase text-muted mb-1.5">
                Category
              </label>
              <select
                id="goal-category"
                value={draft.category}
                onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value as Category }))}
                disabled={disabled}
                className="w-full px-3 py-2.5 border border-border-input rounded-md text-[13px]"
                style={{ background: fieldBg }}
              >
                <option value="INDIVIDUAL">Individual</option>
                <option value="TEAM">Team</option>
                <option value="ORGANIZATIONAL">Organizational</option>
              </select>
            </div>
            <div>
              <label htmlFor="goal-status" className="block font-heading text-[10px] tracking-[0.12em] uppercase text-muted mb-1.5">
                Status
              </label>
              <select
                id="goal-status"
                value={draft.status}
                onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as GoalStatus }))}
                disabled={disabled}
                className="w-full px-3 py-2.5 border border-border-input rounded-md text-[13px]"
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
            <label htmlFor="goal-confidence" className="block font-heading text-[10px] tracking-[0.12em] uppercase text-muted mb-2.5">
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
              className="w-full accent-chambray"
            />
            <div className="flex justify-between font-heading text-[9px] text-faint mt-1">
              <span>1 · low</span>
              <span>10 · certain</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="font-heading text-[10px] tracking-[0.12em] uppercase text-muted">Key results</label>
              <span className="font-heading text-[10px] text-faint">current / target</span>
            </div>
            <div className="grid gap-2">
              {draft.keyResults.map((kr, i) => (
                <div
                  key={i}
                  className="grid gap-2 items-center"
                  style={{ gridTemplateColumns: "minmax(0,1fr) 70px 62px 70px 26px" }}
                >
                  <input
                    value={kr.description}
                    onChange={(e) => updateKr(i, { description: e.target.value })}
                    disabled={disabled}
                    placeholder="Description"
                    className="px-2.5 py-2 border border-border-input rounded-md text-[13px] min-w-0"
                    style={{ background: fieldBg }}
                  />
                  <input
                    value={kr.current}
                    onChange={(e) => updateKr(i, { current: Number(e.target.value) })}
                    disabled={disabled}
                    type="number"
                    placeholder="Now"
                    className="px-2 py-2 border border-border-input rounded-md text-[12px] font-heading min-w-0"
                    style={{ background: fieldBg }}
                  />
                  <input
                    value={kr.unit}
                    onChange={(e) => updateKr(i, { unit: e.target.value })}
                    disabled={disabled}
                    placeholder="Unit"
                    className="px-2 py-2 border border-border-input rounded-md text-[12px] font-heading min-w-0"
                    style={{ background: fieldBg }}
                  />
                  <input
                    value={kr.target}
                    onChange={(e) => updateKr(i, { target: Number(e.target.value) })}
                    disabled={disabled}
                    type="number"
                    placeholder="Target"
                    className="px-2 py-2 border border-border-input rounded-md text-[12px] font-heading min-w-0"
                    style={{ background: fieldBg }}
                  />
                  <button
                    onClick={() => removeKr(i)}
                    disabled={disabled}
                    title="Remove"
                    className="border-none bg-transparent text-faint text-[15px] cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addKr}
              disabled={disabled}
              className="mt-2.5 px-3 py-2 border border-dashed border-border-input rounded-lg bg-transparent font-heading text-[11px] text-muted cursor-pointer"
            >
              + Add key result
            </button>
          </div>

          {error && <div className="text-[13px] text-status-red">{error}</div>}
        </div>

        <div className="flex justify-end gap-2.5 px-[22px] py-4 border-t border-border-soft bg-surface-alt">
          <button
            onClick={close}
            className="px-4 py-2.5 border border-border-strong rounded-md bg-card font-heading text-[11px] tracking-[0.08em] uppercase cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={disabled}
            className="px-5 py-2.5 text-white border-none font-heading text-[11px] tracking-[0.08em] uppercase rounded-md"
            style={{ background: locked ? "#9AA5B4" : "#455E7F", cursor: disabled ? "default" : "pointer" }}
          >
            {isPending ? "Saving…" : "Save goal"}
          </button>
        </div>
      </div>
    </div>
  );
}

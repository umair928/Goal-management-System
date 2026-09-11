"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateUserAssignment } from "./actions";

export function UserEditModal({
  userId,
  name,
  initial,
  managers,
  closeHref,
}: {
  userId: string;
  name: string;
  initial: { designation: string; department: string; accessLevel: string; managerId: string | null };
  managers: { id: string; name: string }[];
  closeHref: string;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(initial);
  const [isPending, startTransition] = useTransition();

  function close() {
    router.push(closeHref);
  }

  function save() {
    startTransition(async () => {
      await updateUserAssignment(userId, draft);
      router.push(closeHref);
      router.refresh();
    });
  }

  return (
    <div className="fixed inset-0 bg-[rgba(37,50,68,0.45)] grid place-items-center p-6 z-40 overflow-auto" onClick={close}>
      <div
        className="w-full max-w-[480px] bg-card border border-border-input rounded-lg overflow-hidden animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-soft">
          <div className="font-heading text-[11px] tracking-[0.1em] uppercase">Assign {name}</div>
          <button onClick={close} className="bg-transparent border-none text-[18px] text-muted cursor-pointer leading-none">
            ×
          </button>
        </div>

        <div className="p-5 grid gap-4">
          <div>
            <label htmlFor="assign-designation" className="block font-heading text-[10px] tracking-[0.12em] uppercase text-muted mb-1.5">
              Designation
            </label>
            <input
              id="assign-designation"
              value={draft.designation}
              onChange={(e) => setDraft((d) => ({ ...d, designation: e.target.value }))}
              className="w-full px-3 py-2.5 border border-border-input rounded-md text-[14px] bg-surface-alt"
            />
          </div>
          <div>
            <label htmlFor="assign-department" className="block font-heading text-[10px] tracking-[0.12em] uppercase text-muted mb-1.5">
              Department
            </label>
            <input
              id="assign-department"
              value={draft.department}
              onChange={(e) => setDraft((d) => ({ ...d, department: e.target.value }))}
              className="w-full px-3 py-2.5 border border-border-input rounded-md text-[14px] bg-surface-alt"
            />
          </div>
          <div>
            <label htmlFor="assign-manager" className="block font-heading text-[10px] tracking-[0.12em] uppercase text-muted mb-1.5">
              Reports to
            </label>
            <select
              id="assign-manager"
              value={draft.managerId ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, managerId: e.target.value || null }))}
              className="w-full px-3 py-2.5 border border-border-input rounded-md text-[13px] bg-surface-alt"
            >
              <option value="">No manager</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="assign-access" className="block font-heading text-[10px] tracking-[0.12em] uppercase text-muted mb-1.5">
              Access level
            </label>
            <input
              id="assign-access"
              value={draft.accessLevel}
              onChange={(e) => setDraft((d) => ({ ...d, accessLevel: e.target.value }))}
              placeholder="e.g. Standard, Team, Company-wide"
              className="w-full px-3 py-2.5 border border-border-input rounded-md text-[14px] bg-surface-alt"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2.5 px-5 py-4 border-t border-border-soft bg-surface-alt">
          <button
            onClick={close}
            className="px-4 py-2.5 border border-border-strong rounded-md bg-card font-heading text-[11px] tracking-[0.08em] uppercase cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={isPending}
            className="px-5 py-2.5 bg-chambray hover:bg-chambray-hover text-white border-none font-heading text-[11px] tracking-[0.08em] uppercase rounded-md cursor-pointer"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

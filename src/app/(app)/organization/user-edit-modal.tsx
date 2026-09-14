"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateUserAssignment } from "./actions";
import styles from "./user-edit-modal.module.css";

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
    <div className={styles.overlay} onClick={close}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>Assign {name}</div>
          <button onClick={close} className={styles.closeButton}>
            ×
          </button>
        </div>

        <div className={styles.body}>
          <div>
            <label htmlFor="assign-designation" className={styles.field}>
              Designation
            </label>
            <input
              id="assign-designation"
              value={draft.designation}
              onChange={(e) => setDraft((d) => ({ ...d, designation: e.target.value }))}
              className={styles.input}
            />
          </div>
          <div>
            <label htmlFor="assign-department" className={styles.field}>
              Department
            </label>
            <input
              id="assign-department"
              value={draft.department}
              onChange={(e) => setDraft((d) => ({ ...d, department: e.target.value }))}
              className={styles.input}
            />
          </div>
          <div>
            <label htmlFor="assign-manager" className={styles.field}>
              Reports to
            </label>
            <select
              id="assign-manager"
              value={draft.managerId ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, managerId: e.target.value || null }))}
              className={styles.select}
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
            <label htmlFor="assign-access" className={styles.field}>
              Access level
            </label>
            <input
              id="assign-access"
              value={draft.accessLevel}
              onChange={(e) => setDraft((d) => ({ ...d, accessLevel: e.target.value }))}
              placeholder="e.g. Standard, Team, Company-wide"
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.footer}>
          <button onClick={close} className={styles.cancelButton}>
            Cancel
          </button>
          <button onClick={save} disabled={isPending} className={styles.saveButton}>
            {isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateProfile, type ProfileInput } from "./actions";
import styles from "./profile-form.module.css";

export function ProfileForm({ initial }: { initial: ProfileInput }) {
  const [draft, setDraft] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function field<K extends keyof ProfileInput>(key: K) {
    return {
      id: `profile-${key}`,
      value: draft[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setSaved(false);
        setDraft((d) => ({ ...d, [key]: e.target.value }));
      },
    };
  }

  function save() {
    startTransition(async () => {
      await updateProfile(draft);
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>Your details</div>
      <div className={styles.body}>
        <div className={styles.grid}>
          <div>
            <label htmlFor="profile-preferredName" className={styles.field}>
              Preferred name
            </label>
            <input {...field("preferredName")} className={styles.input} />
          </div>
          <div>
            <label htmlFor="profile-pronouns" className={styles.field}>
              Pronouns
            </label>
            <input {...field("pronouns")} className={styles.input} />
          </div>
          <div>
            <label htmlFor="profile-location" className={styles.field}>
              Location
            </label>
            <input {...field("location")} className={styles.input} />
          </div>
          <div>
            <label htmlFor="profile-phone" className={styles.field}>
              Contact number
            </label>
            <input {...field("phone")} className={styles.input} />
          </div>
        </div>
        <div>
          <label htmlFor="profile-about" className={styles.field}>
            What you work on
          </label>
          <textarea
            {...field("about")}
            rows={3}
            placeholder="A short description of your responsibilities this quarter."
            className={styles.textarea}
          />
        </div>
        <div>
          <label htmlFor="profile-skills" className={styles.field}>
            Skills
          </label>
          <input {...field("skills")} placeholder="Comma separated" className={styles.input} />
        </div>
        <div className={styles.footer}>
          {saved && !isPending && <span className={styles.savedNote}>Saved</span>}
          <button onClick={save} disabled={isPending} className={styles.saveButton}>
            {isPending ? "Saving…" : "Save my details"}
          </button>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateProfile, type ProfileInput } from "./actions";

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

  const inputClass = "w-full px-3 py-[11px] border border-border-input bg-surface-alt text-[14px] rounded-md";

  return (
    <section className="bg-card border border-border rounded-[10px]">
      <div className="px-5 py-3.5 border-b border-border-soft font-heading text-[11px] tracking-[0.1em] uppercase">
        Your details
      </div>
      <div className="p-5 grid gap-[18px]">
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <div>
            <label htmlFor="profile-preferredName" className="block font-heading text-[10px] tracking-[0.12em] uppercase text-muted mb-1.5">
              Preferred name
            </label>
            <input {...field("preferredName")} className={inputClass} />
          </div>
          <div>
            <label htmlFor="profile-pronouns" className="block font-heading text-[10px] tracking-[0.12em] uppercase text-muted mb-1.5">
              Pronouns
            </label>
            <input {...field("pronouns")} className={inputClass} />
          </div>
          <div>
            <label htmlFor="profile-location" className="block font-heading text-[10px] tracking-[0.12em] uppercase text-muted mb-1.5">
              Location
            </label>
            <input {...field("location")} className={inputClass} />
          </div>
          <div>
            <label htmlFor="profile-phone" className="block font-heading text-[10px] tracking-[0.12em] uppercase text-muted mb-1.5">
              Contact number
            </label>
            <input {...field("phone")} className={inputClass} />
          </div>
        </div>
        <div>
          <label htmlFor="profile-about" className="block font-heading text-[10px] tracking-[0.12em] uppercase text-muted mb-1.5">
            What you work on
          </label>
          <textarea
            {...field("about")}
            rows={3}
            placeholder="A short description of your responsibilities this quarter."
            className={`${inputClass} resize-y font-[inherit] leading-relaxed`}
          />
        </div>
        <div>
          <label htmlFor="profile-skills" className="block font-heading text-[10px] tracking-[0.12em] uppercase text-muted mb-1.5">
            Skills
          </label>
          <input {...field("skills")} placeholder="Comma separated" className={inputClass} />
        </div>
        <div className="flex justify-end items-center gap-3">
          {saved && !isPending && <span className="text-[12px] text-status-green">Saved</span>}
          <button
            onClick={save}
            disabled={isPending}
            className="px-5 py-2.5 bg-chambray hover:bg-chambray-hover text-white border-none font-heading text-[11px] tracking-[0.08em] uppercase rounded-md cursor-pointer"
          >
            {isPending ? "Saving…" : "Save my details"}
          </button>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { postRemark } from "./actions";
import styles from "./remark-composer.module.css";

export function RemarkComposer({ goalId, firstName }: { goalId: string; firstName: string }) {
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    if (!text.trim()) return;
    startTransition(async () => {
      await postRemark(goalId, text);
      setText("");
      router.refresh();
    });
  }

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        placeholder={`Add a remark for ${firstName}…`}
        className={styles.textarea}
      />
      <div className={styles.footer}>
        <button onClick={submit} disabled={isPending || !text.trim()} className={styles.postButton}>
          {isPending ? "Posting…" : "Post remark"}
        </button>
      </div>
    </div>
  );
}

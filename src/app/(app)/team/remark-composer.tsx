"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { postRemark } from "./actions";

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
        className="w-full px-3 py-2.5 border border-border-input bg-card text-[13px] rounded-md resize-y font-[inherit]"
      />
      <div className="flex justify-end mt-2.5">
        <button
          onClick={submit}
          disabled={isPending || !text.trim()}
          className="px-3.5 py-2 bg-chambray hover:bg-chambray-hover text-white border-none font-heading text-[10px] tracking-[0.08em] uppercase rounded-md cursor-pointer disabled:opacity-60"
        >
          {isPending ? "Posting…" : "Post remark"}
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { addComment } from "@/lib/actions/posts";
import { buttonClass, fieldClass, cn } from "@/components/ui/kit";

export function CommentForm({ postId }: { postId: number }) {
  const t = useTranslations("feed");
  const router = useRouter();
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSaving(true);
    const res = await addComment({ postId, body });
    setSaving(false);
    if (res.ok) {
      setBody("");
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-2">
      <textarea
        className={cn(fieldClass, "min-h-24 resize-y")}
        placeholder={t("commentPlaceholder")}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={4000}
      />
      <button
        type="submit"
        disabled={saving || !body.trim()}
        className={buttonClass("primary", "self-end")}
      >
        {saving ? t("sending") : t("addComment")}
      </button>
    </form>
  );
}

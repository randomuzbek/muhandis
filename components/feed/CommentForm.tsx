"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { addComment } from "@/lib/actions/posts";

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
        className="w-full rounded-lg border border-foreground/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/40"
        placeholder={t("commentPlaceholder")}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
      />
      <button
        type="submit"
        disabled={saving || !body.trim()}
        className="self-start rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {saving ? t("sending") : t("addComment")}
      </button>
    </form>
  );
}

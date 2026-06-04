"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toggleReaction } from "@/lib/actions/posts";

export function LikeButton({
  postId,
  initialCount,
}: {
  postId: number;
  initialCount: number;
}) {
  const t = useTranslations("feed");
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(false);
  const [pending, setPending] = useState(false);

  async function onClick() {
    if (pending) return;
    setPending(true);
    // İyimser güncelleme
    const optimistic = liked ? count - 1 : count + 1;
    setLiked(!liked);
    setCount(optimistic);
    const res = await toggleReaction(postId);
    setPending(false);
    if (!res.ok) {
      // geri al
      setLiked(liked);
      setCount(count);
    } else {
      setLiked(res.liked);
    }
  }

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition ${
        liked
          ? "border-transparent bg-red-500/15 text-red-600 dark:text-red-400"
          : "border-foreground/20 hover:bg-foreground/5"
      }`}
    >
      <span>{liked ? "♥" : "♡"}</span>
      <span>{count}</span>
      <span className="opacity-70">{t("like")}</span>
    </button>
  );
}

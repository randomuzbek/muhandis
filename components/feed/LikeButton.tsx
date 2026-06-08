"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toggleReaction } from "@/lib/actions/posts";
import { cn } from "@/components/ui/kit";

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
      type="button"
      onClick={onClick}
      aria-pressed={liked}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium ring-1 transition active:scale-[0.97]",
        liked
          ? "bg-red-500/15 text-red-600 ring-transparent dark:text-red-400"
          : "text-[var(--color-foreground)] ring-[var(--color-separator)] hover:bg-[var(--color-secondary)]",
      )}
    >
      <HeartIcon filled={liked} />
      <span>{count}</span>
      <span className="text-[var(--color-hint)]">{t("like")}</span>
    </button>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
    </svg>
  );
}

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toggleReaction } from "@/lib/actions/posts";
import { cn } from "@/components/ui/kit";

export function LikeButton({
  postId,
  initialCount,
  initiallyLiked = false,
}: {
  postId: number;
  initialCount: number;
  initiallyLiked?: boolean;
}) {
  const t = useTranslations("feed");
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(initiallyLiked);
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
          ? "bg-[var(--color-secondary)] text-[var(--color-accent)] ring-transparent"
          : "text-[var(--color-foreground)] ring-[var(--color-separator)] hover:bg-[var(--color-secondary)]",
      )}
    >
      <ThanksIcon filled={liked} />
      <span>{count}</span>
      <span className="text-[var(--color-hint)]">{t("thank")}</span>
    </button>
  );
}

function ThanksIcon({ filled }: { filled: boolean }) {
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
      <path d="M7 10v11" />
      <path d="M4 21h3V10H4a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1Z" />
      <path d="M7 10l4-7a2 2 0 0 1 3 1.7V9h4.5a2 2 0 0 1 2 2.3l-1.3 7A2 2 0 0 1 19.2 20H7" />
    </svg>
  );
}

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toggleReaction } from "@/lib/actions/posts";
import { cn } from "@/components/ui/kit";

type ToggleResult =
  | { ok: true; liked: boolean }
  | { ok: false; error: string };

// Tek pozitif sinyal = "Rahmat". Hem gönderi (toggleReaction) hem yorum
// (toggleCommentReaction) için aynı buton; action prop'u ile hedef belirlenir.
export function ReactionButton({
  targetId,
  initialCount,
  initiallyReacted = false,
  action = toggleReaction,
  compact = false,
}: {
  targetId: number;
  initialCount: number;
  initiallyReacted?: boolean;
  action?: (id: number) => Promise<ToggleResult>;
  compact?: boolean;
}) {
  const t = useTranslations("feed");
  const [count, setCount] = useState(initialCount);
  const [reacted, setReacted] = useState(initiallyReacted);
  const [pending, setPending] = useState(false);

  async function onClick() {
    if (pending) return;
    setPending(true);
    // İyimser güncelleme; hata olursa önceki duruma dön.
    const prevCount = count;
    const prevReacted = reacted;
    setReacted(!reacted);
    setCount(reacted ? count - 1 : count + 1);
    const res = await action(targetId);
    setPending(false);
    if (!res.ok) {
      setReacted(prevReacted);
      setCount(prevCount);
    } else {
      setReacted(res.liked);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={reacted}
      className={cn(
        "inline-flex items-center rounded-full font-medium ring-1 transition active:scale-[0.97]",
        compact ? "h-8 gap-1 px-3 text-xs" : "h-9 gap-1.5 px-3.5 text-sm",
        reacted
          ? "bg-[var(--color-secondary)] text-[var(--color-accent)] ring-transparent"
          : "text-[var(--color-foreground)] ring-[var(--color-separator)] hover:bg-[var(--color-secondary)]",
      )}
    >
      <ThanksIcon filled={reacted} size={compact ? 14 : 16} />
      {count > 0 && <span>{count}</span>}
      <span className="text-[var(--color-hint)]">{t("thank")}</span>
    </button>
  );
}

function ThanksIcon({ filled, size }: { filled: boolean; size: number }) {
  return (
    <svg
      width={size}
      height={size}
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

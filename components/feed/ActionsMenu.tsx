"use client";

import { useState } from "react";
import { cn } from "@/components/ui/kit";

export interface MenuItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
}

// Küçük "⋯" kebap menüsü (düzenle/sil/şikayet için).
export function ActionsMenu({
  items,
  label,
}: {
  items: MenuItem[];
  label: string;
}) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        onClick={() => setOpen((o) => !o)}
        className="grid size-8 place-items-center rounded-full text-[var(--color-hint)] transition hover:bg-[var(--color-secondary)] hover:text-[var(--color-foreground)]"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <circle cx="5" cy="12" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="19" cy="12" r="1.8" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div
            role="menu"
            className="card-in absolute right-0 z-40 mt-1 min-w-36 overflow-hidden rounded-xl border border-[var(--color-separator)] bg-[var(--color-section)] py-1 shadow-lg"
          >
            {items.map((it, i) => (
              <button
                key={i}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  it.onClick();
                }}
                className={cn(
                  "block w-full px-3.5 py-2 text-left text-sm transition hover:bg-[var(--color-secondary)]",
                  it.danger && "text-[var(--color-destructive)]",
                )}
              >
                {it.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

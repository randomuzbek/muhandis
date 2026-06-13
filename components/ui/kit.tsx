import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

// Basit className birleştirici
export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

// ---- Buton sınıfları (Link veya <button> ile kullanılabilir) ----
export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";

export function buttonClass(
  variant: ButtonVariant = "primary",
  extra?: string,
): string {
  const base =
    "inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-field)] px-5 text-[0.95rem] font-medium transition active:scale-[0.98] disabled:opacity-50";
  const styles: Record<ButtonVariant, string> = {
    primary: "bg-[var(--color-button)] text-[var(--color-button-foreground)] hover:opacity-90",
    secondary: "bg-[var(--color-secondary)] text-[var(--color-link)] hover:opacity-80",
    ghost: "text-[var(--color-link)] hover:bg-[var(--color-secondary)]",
    destructive: "bg-[var(--color-destructive)] text-white hover:opacity-90",
  };
  return cn(base, styles[variant], extra);
}

// ---- Alan (input/select/textarea) sınıfı ----
export const fieldClass =
  "w-full rounded-[var(--radius-field)] bg-[var(--color-section)] px-4 py-3 text-[0.95rem] text-[var(--color-foreground)] outline-none ring-1 ring-[var(--color-separator)] transition placeholder:text-[var(--color-hint)] focus:ring-2 focus:ring-[var(--color-button)]";

// ---- Kart ----
export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] bg-[var(--color-section)] ring-1 ring-[var(--color-separator)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

// ---- Bölüm başlığı (kartların üstünde, küçük, ipucu rengi) ----
export function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <h2 className="px-1 pb-2 pt-5 text-xs font-semibold uppercase tracking-wide text-[var(--color-hint)]">
      {children}
    </h2>
  );
}

// ---- Avatar (foto yoksa baş harf + üretilen renk) ----
const AVATAR_HUES = [210, 160, 280, 20, 340, 50, 120, 0];

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function hueFor(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_HUES[h % AVATAR_HUES.length];
}

export function Avatar({
  name,
  src,
  size = 44,
  seed,
}: {
  name?: string | null;
  src?: string | null;
  size?: number;
  seed?: string;
}) {
  const label = name?.trim() || "";
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={label || "avatar"}
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  const hue = hueFor(seed || label || "muhandis");
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        background: `hsl(${hue} 55% 88%)`,
        color: `hsl(${hue} 55% 32%)`,
      }}
    >
      {initialsOf(label)}
    </span>
  );
}

// ---- Chip / etiket ----
export function Chip({
  children,
  active,
  className,
}: {
  children: ReactNode;
  active?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm",
        active
          ? "bg-[var(--color-button)] text-[var(--color-button-foreground)]"
          : "bg-[var(--color-secondary)] text-[var(--color-foreground)]",
        className,
      )}
    >
      {children}
    </span>
  );
}

// ---- Rozet ----
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "accent";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-[var(--color-secondary)] text-[var(--color-foreground)]",
    success: "bg-green-500/15 text-green-600 dark:text-green-400",
    accent: "bg-[var(--color-button)]/15 text-[var(--color-accent)]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

// ---- İlerleme çubuğu (0..1) ----
export function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-secondary)]">
      <div
        className="h-full rounded-full bg-[var(--color-button)] transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ---- Sayı kartı (KPI) ----
export function Stat({ label, value }: { label: ReactNode; value: number }) {
  return (
    <Card className="p-4">
      <div className="text-3xl font-bold tabular-nums">{value}</div>
      <div className="mt-0.5 text-xs text-[var(--color-hint)]">{label}</div>
    </Card>
  );
}

// ---- Çubuk satırı (etiket + sayı + oran çubuğu) ----
// href verilirse satır tıklanabilir olur (ör. istatistik → filtrelenmiş dizin).
export function BarRow({
  label,
  count,
  value,
  href,
}: {
  label: ReactNode;
  count: number;
  value: number;
  href?: string;
}) {
  const inner = (
    <>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="truncate font-medium">{label}</span>
        <span className="shrink-0 tabular-nums text-[var(--color-hint)]">
          {count}
        </span>
      </div>
      <ProgressBar value={value} />
    </>
  );
  if (href) {
    return (
      <li>
        <Link
          href={href}
          className="-mx-2 flex flex-col gap-1.5 rounded-[var(--radius-field)] px-2 py-1 transition hover:bg-[var(--color-secondary)]"
        >
          {inner}
        </Link>
      </li>
    );
  }
  return <li className="flex flex-col gap-1.5">{inner}</li>;
}

// ---- Boş durum ----
export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon?: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
      {icon && <div className="text-4xl">{icon}</div>}
      <p className="font-medium">{title}</p>
      {hint && (
        <p className="max-w-xs text-sm text-[var(--color-hint)]">{hint}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// ---- İskelet ----
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-md", className)} />;
}

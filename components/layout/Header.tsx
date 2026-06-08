"use client";

import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useTelegram } from "@/components/telegram/TelegramProvider";
import { Avatar, cn } from "@/components/ui/kit";

export function Header() {
  const t = useTranslations("nav");
  const { data: session, status } = useSession();
  const { isMiniApp } = useTelegram();
  const pathname = usePathname();
  const authed = status === "authenticated";

  const tabs = [
    { href: "/directory", label: t("directory") },
    { href: "/feed", label: t("feed") },
  ];

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--color-separator)] bg-[var(--color-background)]/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3 px-5 py-2.5">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Muhandis
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {tabs.map((tab) => {
            const active = pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "rounded-full px-3 py-1.5 transition",
                  active
                    ? "bg-[var(--color-secondary)] font-medium"
                    : "text-[var(--color-hint)] hover:text-[var(--color-foreground)]",
                )}
              >
                {tab.label}
              </Link>
            );
          })}

          {authed ? (
            <Link href="/profile" className="ml-1" aria-label={t("profile")}>
              <Avatar
                name={session?.user?.name}
                src={session?.user?.image}
                size={32}
              />
            </Link>
          ) : (
            !isMiniApp && (
              <Link
                href="/login"
                className="ml-1 rounded-full px-3 py-1.5 text-[var(--color-link)]"
              >
                {t("signIn")}
              </Link>
            )
          )}
          {/* Mini App'te kimlik otomatik; çıkış yalnızca web'de gösterilir. */}
          {!isMiniApp && authed && (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="rounded-full px-2 py-1.5 text-[var(--color-hint)] hover:text-[var(--color-foreground)]"
              aria-label={t("signOut")}
              title={t("signOut")}
            >
              ⏻
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

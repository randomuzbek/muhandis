"use client";

import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function Header() {
  const t = useTranslations("nav");
  const { status } = useSession();
  const authed = status === "authenticated";

  return (
    <header className="sticky top-0 z-10 border-b border-foreground/10 bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-6 py-3">
        <Link href="/" className="font-bold">
          Muhandis
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/directory" className="opacity-70 hover:opacity-100">
            {t("directory")}
          </Link>
          {authed ? (
            <>
              <Link href="/profile" className="opacity-70 hover:opacity-100">
                {t("profile")}
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="opacity-70 hover:opacity-100"
              >
                {t("signOut")}
              </button>
            </>
          ) : (
            <Link href="/login" className="opacity-70 hover:opacity-100">
              {t("signIn")}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

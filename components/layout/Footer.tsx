import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

const GITHUB_URL = "https://github.com/randomuzbek/muhandis";
const COMMUNITY_URL =
  process.env.NEXT_PUBLIC_TELEGRAM_COMMUNITY_URL ?? "https://t.me/muhandis_hub";

export async function Footer() {
  const t = await getTranslations("footer");

  return (
    <footer className="mt-auto border-t border-[var(--color-separator)] py-6 text-sm text-[var(--color-hint)]">
      <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-center gap-x-5 gap-y-2 px-5">
        <span>© {new Date().getFullYear()} Muhandis</span>
        <Link href="/privacy" className="hover:text-[var(--color-foreground)]">
          {t("privacy")}
        </Link>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[var(--color-foreground)]"
        >
          {t("source")}
        </a>
        <a
          href={COMMUNITY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[var(--color-foreground)]"
        >
          {t("community")}
        </a>
      </div>
    </footer>
  );
}

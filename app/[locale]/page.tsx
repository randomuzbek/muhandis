import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { Link } from "@/i18n/navigation";
import { Card, buttonClass } from "@/components/ui/kit";
import { SpotlightCard } from "@/components/home/SpotlightCard";

const TELEGRAM_COMMUNITY_URL =
  process.env.NEXT_PUBLIC_TELEGRAM_COMMUNITY_URL ?? "https://t.me/";
const MINI_APP_URL = process.env.NEXT_PUBLIC_MINI_APP_URL ?? "https://t.me/";

// Spotlight kartı taze kalsın ama her isteğe DB sorgusu olmasın; yeni spotlight
// yayınlanınca createSpotlight revalidatePath ile bunu anında tazeler.
export const revalidate = 300;

// Sohbet Telegram grubunda yaşar; uygulamanın kimliği dizin + topluluk haritası.
const FEATURES = [
  { key: "directory", icon: "🧭", href: "/directory" },
  { key: "stats", icon: "📊", href: "/stats" },
  { key: "mentorship", icon: "🤝", href: "/directory" },
  { key: "community", icon: "💬", href: null },
] as const;

export default function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("home");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-12 px-6 py-14 sm:py-20">
      {/* Hero */}
      <header className="flex flex-col items-center gap-5 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-secondary)] px-3.5 py-1.5 text-sm font-semibold text-[var(--color-accent)]">
          <span aria-hidden>⚙️</span>
          Muhandis
        </span>
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          {t("tagline")}
        </h1>
        <p className="max-w-xl text-balance text-base text-[var(--color-hint)] sm:text-lg">
          {t("description")}
        </p>

        <div className="mt-2 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
          <a href={MINI_APP_URL} className={buttonClass("primary")}>
            {t("openApp")}
          </a>
          <a href={TELEGRAM_COMMUNITY_URL} className={buttonClass("secondary")}>
            <span aria-hidden>✈️</span>
            {t("joinTelegram")}
          </a>
        </div>
      </header>

      {/* Haftaning muhandisi — küratörlü öne çıkan mühendis (varsa) */}
      <SpotlightCard locale={locale} />

      {/* Features */}
      <section className="grid w-full gap-4 sm:grid-cols-2">
        {FEATURES.map(({ key, icon, href }) => {
          const body = (
            <Card className="flex h-full flex-col gap-2 p-6 transition hover:bg-[var(--color-secondary)]/40">
              <span
                className="grid size-11 place-items-center rounded-[var(--radius-field)] bg-[var(--color-secondary)] text-2xl"
                aria-hidden
              >
                {icon}
              </span>
              <h2 className="text-lg font-semibold">
                {t(`features.${key}.title`)}
              </h2>
              <p className="text-sm text-[var(--color-hint)]">
                {t(`features.${key}.desc`)}
              </p>
            </Card>
          );
          return href ? (
            <Link key={key} href={href}>
              {body}
            </Link>
          ) : (
            <a key={key} href={TELEGRAM_COMMUNITY_URL}>
              {body}
            </a>
          );
        })}
      </section>
    </main>
  );
}

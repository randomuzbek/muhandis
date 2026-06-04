import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";

const TELEGRAM_COMMUNITY_URL =
  process.env.NEXT_PUBLIC_TELEGRAM_COMMUNITY_URL ?? "https://t.me/";
const MINI_APP_URL = process.env.NEXT_PUBLIC_MINI_APP_URL ?? "https://t.me/";

const FEATURE_KEYS = ["directory", "qa", "projects", "mentorship"] as const;

export default function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("home");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-12 px-6 py-16 text-center">
      <header className="flex flex-col items-center gap-4">
        <span className="rounded-full border border-foreground/15 px-3 py-1 text-sm font-medium opacity-80">
          Muhandis
        </span>
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          {t("tagline")}
        </h1>
        <p className="max-w-xl text-balance text-base opacity-70 sm:text-lg">
          {t("description")}
        </p>
      </header>

      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <a
          href={TELEGRAM_COMMUNITY_URL}
          className="rounded-full bg-[#229ED9] px-6 py-3 font-medium text-white transition hover:opacity-90"
        >
          {t("joinTelegram")}
        </a>
        <a
          href={MINI_APP_URL}
          className="rounded-full border border-foreground/20 px-6 py-3 font-medium transition hover:bg-foreground/5"
        >
          {t("openApp")}
        </a>
      </div>

      <section className="grid w-full gap-4 sm:grid-cols-2">
        {FEATURE_KEYS.map((key) => (
          <article
            key={key}
            className="rounded-2xl border border-foreground/10 p-6 text-left"
          >
            <h2 className="mb-1 text-lg font-semibold">
              {t(`features.${key}.title`)}
            </h2>
            <p className="text-sm opacity-70">{t(`features.${key}.desc`)}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

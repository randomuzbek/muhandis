import { getTranslations, setRequestLocale } from "next-intl/server";
import { Card } from "@/components/ui/kit";

const UPDATED = "2026-06-08";

const SECTIONS = [
  "collect",
  "use",
  "share",
  "delete",
  "openSource",
  "contact",
] as const;

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10">
      <h1 className="text-2xl font-bold">{t("privacyTitle")}</h1>
      <p className="mt-1 text-sm text-[var(--color-hint)]">
        {t("updated")}: {UPDATED}
      </p>
      <p className="mt-4 text-[0.95rem] leading-relaxed text-[var(--color-foreground)]/85">
        {t("intro")}
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {SECTIONS.map((key) => (
          <Card key={key} className="p-5">
            <h2 className="font-semibold">{t(`${key}Title`)}</h2>
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-foreground)]/80">
              {t(`${key}Body`)}
            </p>
          </Card>
        ))}
      </div>
    </main>
  );
}

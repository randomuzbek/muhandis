import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPublicStats } from "@/lib/queries/stats";
import { ENGINEERING_FIELDS, labelFor } from "@/lib/data/taxonomy";
import { countryName } from "@/lib/data/places";
import { Link } from "@/i18n/navigation";
import {
  BarRow,
  Card,
  SectionHeader,
  EmptyState,
  Stat,
  buttonClass,
} from "@/components/ui/kit";

// Topluluk haritası herkese açık; sayılar 5 dakikada bir tazelenir.
export const revalidate = 300;

export default async function StatsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [stats, t] = await Promise.all([
    getPublicStats(),
    getTranslations("stats"),
  ]);

  const fieldLabel = (slug: string) => {
    const f = ENGINEERING_FIELDS.find((x) => x.slug === slug);
    return f ? labelFor(f.labels, locale) : slug;
  };

  const maxField = Math.max(1, ...stats.byField.map((f) => f.count));
  const maxCountry = Math.max(1, ...stats.byCountry.map((c) => c.count));

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-[var(--color-hint)]">{t("subtitle")}</p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={t("kpi.members")} value={stats.totalUsers} />
        <Stat label={t("kpi.countries")} value={stats.countryCount} />
        <Stat label={t("kpi.mentoring")} value={stats.mentoringCount} />
        <Stat label={t("kpi.collaborators")} value={stats.collaboratorsCount} />
      </div>

      <SectionHeader>{t("byField")}</SectionHeader>
      <Card className="p-4">
        {stats.byField.length === 0 ? (
          <EmptyState title={t("empty")} />
        ) : (
          <ul className="flex flex-col gap-3">
            {stats.byField.map((f) => (
              <BarRow
                key={f.slug}
                label={fieldLabel(f.slug)}
                count={f.count}
                value={f.count / maxField}
              />
            ))}
          </ul>
        )}
      </Card>

      <SectionHeader>{t("byCountry")}</SectionHeader>
      <Card className="p-4">
        {stats.byCountry.length === 0 ? (
          <EmptyState title={t("empty")} />
        ) : (
          <ul className="flex flex-col gap-3">
            {stats.byCountry.map((c) => (
              <BarRow
                key={c.country}
                label={countryName(c.country, locale) || c.country}
                count={c.count}
                value={c.count / maxCountry}
              />
            ))}
          </ul>
        )}
      </Card>

      <div className="mt-8 flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-[var(--color-hint)]">{t("cta")}</p>
        <Link href="/directory" className={buttonClass("primary")}>
          {t("openDirectory")}
        </Link>
      </div>
    </main>
  );
}

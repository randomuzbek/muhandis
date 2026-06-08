import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { getSessionUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/isAdmin";
import { getAdminStats } from "@/lib/queries/stats";
import { ENGINEERING_FIELDS, labelFor } from "@/lib/data/taxonomy";
import { countryName } from "@/lib/data/places";
import { Card, ProgressBar, SectionHeader, EmptyState } from "@/components/ui/kit";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getSessionUser();
  if (!(await isAdmin(user?.id))) notFound();

  const stats = await getAdminStats();
  const t = await getTranslations("admin");

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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label={t("kpi.users")} value={stats.totalUsers} />
        <Stat label={t("kpi.profiles")} value={stats.totalProfiles} />
        <Stat label={t("kpi.posts")} value={stats.totalPosts} />
        <Stat label={t("kpi.comments")} value={stats.totalComments} />
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
    </main>
  );
}

function Stat({ label, value }: { label: ReactNode; value: number }) {
  return (
    <Card className="p-4">
      <div className="text-3xl font-bold tabular-nums">{value}</div>
      <div className="mt-0.5 text-xs text-[var(--color-hint)]">{label}</div>
    </Card>
  );
}

function BarRow({
  label,
  count,
  value,
}: {
  label: ReactNode;
  count: number;
  value: number;
}) {
  return (
    <li className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="truncate font-medium">{label}</span>
        <span className="shrink-0 tabular-nums text-[var(--color-hint)]">
          {count}
        </span>
      </div>
      <ProgressBar value={value} />
    </li>
  );
}

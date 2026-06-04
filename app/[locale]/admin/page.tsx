import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/isAdmin";
import { getAdminStats } from "@/lib/queries/stats";
import { ENGINEERING_FIELDS, labelFor } from "@/lib/data/taxonomy";

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

  const fieldLabel = (slug: string) => {
    const f = ENGINEERING_FIELDS.find((x) => x.slug === slug);
    return f ? labelFor(f.labels, locale) : slug;
  };

  const maxField = Math.max(1, ...stats.byField.map((f) => f.count));

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <h1 className="mb-6 text-2xl font-bold">Admin · Statistics</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Users" value={stats.totalUsers} />
        <Stat label="Profiles" value={stats.totalProfiles} />
        <Stat label="Posts" value={stats.totalPosts} />
        <Stat label="Comments" value={stats.totalComments} />
        <Stat label="Open to mentoring" value={stats.mentoringCount} />
        <Stat label="Seeking collab" value={stats.collaboratorsCount} />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide opacity-50">
          By field
        </h2>
        <ul className="flex flex-col gap-2">
          {stats.byField.map((f) => (
            <li key={f.slug} className="flex items-center gap-3 text-sm">
              <span className="w-40 shrink-0">{fieldLabel(f.slug)}</span>
              <span className="h-2 flex-1 rounded-full bg-foreground/10">
                <span
                  className="block h-2 rounded-full bg-foreground/60"
                  style={{ width: `${(f.count / maxField) * 100}%` }}
                />
              </span>
              <span className="w-8 text-right tabular-nums opacity-70">
                {f.count}
              </span>
            </li>
          ))}
          {stats.byField.length === 0 && (
            <li className="text-sm opacity-50">—</li>
          )}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide opacity-50">
          By country
        </h2>
        <ul className="flex flex-col gap-1.5">
          {stats.byCountry.map((c) => (
            <li
              key={c.country}
              className="flex justify-between text-sm opacity-80"
            >
              <span>{c.country}</span>
              <span className="tabular-nums">{c.count}</span>
            </li>
          ))}
          {stats.byCountry.length === 0 && (
            <li className="text-sm opacity-50">—</li>
          )}
        </ul>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-foreground/10 p-4">
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs opacity-60">{label}</div>
    </div>
  );
}

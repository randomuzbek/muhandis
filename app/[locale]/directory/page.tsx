import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { searchProfiles, type DirectoryFilters } from "@/lib/queries/directory";
import { ENGINEERING_FIELDS, labelFor } from "@/lib/data/taxonomy";

type SearchParams = Record<string, string | string[] | undefined>;

function str(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v || undefined;
}

export default async function DirectoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;

  const filters: DirectoryFilters = {
    q: str(sp.q),
    field: str(sp.field),
    country: str(sp.country),
    mentoring: str(sp.mentoring) === "1",
    collaborators: str(sp.collaborators) === "1",
  };

  const results = await searchProfiles(filters);
  const t = await getTranslations("directory");

  const inputClass =
    "rounded-lg border border-foreground/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/40";

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <h1 className="mb-6 text-2xl font-bold">{t("title")}</h1>

      <form
        method="get"
        className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <input
          name="q"
          defaultValue={filters.q ?? ""}
          placeholder={t("searchPlaceholder")}
          className={`${inputClass} sm:col-span-2`}
        />
        <select
          name="field"
          defaultValue={filters.field ?? ""}
          className={inputClass}
        >
          <option value="">{t("allFields")}</option>
          {ENGINEERING_FIELDS.map((f) => (
            <option key={f.slug} value={f.slug}>
              {labelFor(f.labels, locale)}
            </option>
          ))}
        </select>
        <input
          name="country"
          defaultValue={filters.country ?? ""}
          placeholder={t("countryPlaceholder")}
          className={inputClass}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="mentoring"
            value="1"
            defaultChecked={filters.mentoring}
            className="h-4 w-4"
          />
          {t("mentoring")}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="collaborators"
            value="1"
            defaultChecked={filters.collaborators}
            className="h-4 w-4"
          />
          {t("collaborators")}
        </label>
        <button
          type="submit"
          className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background sm:col-span-2 lg:col-span-1"
        >
          {t("apply")}
        </button>
      </form>

      {results.length === 0 ? (
        <p className="py-12 text-center opacity-60">{t("empty")}</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {results.map((r) => (
            <li key={r.userId}>
              <Link
                href={`/u/${r.userId}`}
                className="block h-full rounded-2xl border border-foreground/10 p-5 transition hover:bg-foreground/5"
              >
                <h2 className="font-semibold">{r.displayName}</h2>
                {r.headline && (
                  <p className="mt-0.5 text-sm opacity-70">{r.headline}</p>
                )}
                <p className="mt-1 text-sm opacity-55">
                  {[r.currentRole, r.company].filter(Boolean).join(" · ")}
                </p>
                <p className="text-sm opacity-55">
                  {[r.city, r.country].filter(Boolean).join(", ")}
                </p>
                {r.fieldSlugs.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {r.fieldSlugs.map((slug) => {
                      const f = ENGINEERING_FIELDS.find((x) => x.slug === slug);
                      if (!f) return null;
                      return (
                        <span
                          key={slug}
                          className="rounded-full bg-foreground/10 px-2.5 py-0.5 text-xs"
                        >
                          {labelFor(f.labels, locale)}
                        </span>
                      );
                    })}
                  </div>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {r.openToMentoring && (
                    <span className="text-xs text-green-600 dark:text-green-400">
                      ● {t("mentoring")}
                    </span>
                  )}
                  {r.lookingForCollaborators && (
                    <span className="text-xs text-blue-600 dark:text-blue-400">
                      ● {t("collaborators")}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

import { getTranslations, setRequestLocale } from "next-intl/server";
import { searchProfiles, type DirectoryFilters } from "@/lib/queries/directory";
import { getFieldCounts } from "@/lib/queries/stats";
import { ENGINEERING_FIELDS, labelFor } from "@/lib/data/taxonomy";
import { DirectorySearch } from "@/components/directory/DirectorySearch";

// İstatistik sayfasından gelen ?field=/?country= gibi paylaşılabilir derin
// bağlantıları sunucuda okuyabilmek için sayfa istek-anında render edilir.
function param(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v && v.trim() ? v.trim() : undefined;
}

export default async function DirectoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const initialFilters: DirectoryFilters = {
    q: param(sp.q),
    field: param(sp.field),
    country: param(sp.country),
    mentoring: sp.mentoring === "1" || undefined,
    collaborators: sp.collaborators === "1" || undefined,
  };

  const [initialResults, fieldCounts, t] = await Promise.all([
    searchProfiles(initialFilters),
    getFieldCounts(),
    getTranslations("directory"),
  ]);

  const countBySlug = new Map(fieldCounts.map((f) => [f.slug, f.count]));
  const fieldOptions = ENGINEERING_FIELDS.map((f) => ({
    slug: f.slug,
    label: labelFor(f.labels, locale),
    count: countBySlug.get(f.slug) ?? 0,
  }));

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
      <h1 className="mb-4 text-2xl font-bold">{t("title")}</h1>
      <DirectorySearch
        initialResults={initialResults}
        initialFilters={initialFilters}
        locale={locale}
        fieldOptions={fieldOptions}
      />
    </main>
  );
}

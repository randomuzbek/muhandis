import { getTranslations, setRequestLocale } from "next-intl/server";
import { searchProfiles } from "@/lib/queries/directory";
import { getFieldCounts } from "@/lib/queries/stats";
import { ENGINEERING_FIELDS, labelFor } from "@/lib/data/taxonomy";
import { DirectorySearch } from "@/components/directory/DirectorySearch";

// Başlangıç sonuçları ve alan sayaçları deploy'a kilitlenmesin; 5 dk'da bir tazelenir.
export const revalidate = 300;

export default async function DirectoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [initialResults, fieldCounts, t] = await Promise.all([
    searchProfiles({}),
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
        locale={locale}
        fieldOptions={fieldOptions}
      />
    </main>
  );
}

import { getTranslations, setRequestLocale } from "next-intl/server";
import { searchProfiles } from "@/lib/queries/directory";
import { ENGINEERING_FIELDS, labelFor } from "@/lib/data/taxonomy";
import { DirectorySearch } from "@/components/directory/DirectorySearch";

export default async function DirectoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [initialResults, t] = await Promise.all([
    searchProfiles({}),
    getTranslations("directory"),
  ]);

  const fieldOptions = ENGINEERING_FIELDS.map((f) => ({
    slug: f.slug,
    label: labelFor(f.labels, locale),
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

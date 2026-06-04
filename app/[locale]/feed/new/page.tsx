import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { NewPostForm } from "@/components/feed/NewPostForm";
import { TOPICS, labelFor } from "@/lib/data/taxonomy";

export default async function NewPostPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/login`);

  const t = await getTranslations("feed");
  const topics = TOPICS.map((tp) => ({
    slug: tp.slug,
    label: labelFor(tp.labels, locale),
  }));

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <h1 className="mb-6 text-2xl font-bold">{t("newPost")}</h1>
      <NewPostForm topics={topics} />
    </main>
  );
}

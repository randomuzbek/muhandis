import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { getPost } from "@/lib/queries/feed";
import { getSessionUser } from "@/lib/auth/session";
import { NewPostForm } from "@/components/feed/NewPostForm";
import { TOPICS, labelFor } from "@/lib/data/taxonomy";
import type { PostType } from "@/lib/data/posts";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const numericId = Number(id);
  if (!Number.isInteger(numericId)) notFound();

  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/login`);

  const data = await getPost(numericId);
  if (!data) notFound();
  // Yalnızca yazarı düzenleyebilir.
  if (data.post.authorId !== user.id) redirect(`/${locale}/feed/${numericId}`);

  const t = await getTranslations("feed");
  const topics = TOPICS.map((tp) => ({
    slug: tp.slug,
    label: labelFor(tp.labels, locale),
  }));

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6">
      <h1 className="mb-5 text-2xl font-bold">{t("editPost")}</h1>
      <NewPostForm
        topics={topics}
        initial={{
          id: numericId,
          type: data.post.type as PostType,
          topicSlug: data.post.topicSlug ?? "",
          title: data.post.title ?? "",
          body: data.post.body,
        }}
      />
    </main>
  );
}

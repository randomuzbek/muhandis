import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getPost } from "@/lib/queries/feed";
import { getSessionUser } from "@/lib/auth/session";
import { LikeButton } from "@/components/feed/LikeButton";
import { CommentForm } from "@/components/feed/CommentForm";
import { TOPICS, labelFor } from "@/lib/data/taxonomy";

export default async function PostPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const numericId = Number(id);
  if (!Number.isInteger(numericId)) notFound();

  const data = await getPost(numericId);
  if (!data) notFound();

  const { post, comments, reactionCount } = data;
  const t = await getTranslations("feed");
  const user = await getSessionUser();

  const topicLabel = post.topicSlug
    ? labelFor(
        TOPICS.find((x) => x.slug === post.topicSlug)?.labels ?? {
          uz: post.topicSlug,
          en: post.topicSlug,
          ru: post.topicSlug,
          tr: post.topicSlug,
        },
        locale,
      )
    : null;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <div className="mb-2 flex items-center gap-2 text-xs">
        <span className="rounded-full bg-foreground/10 px-2 py-0.5">
          {t(`type.${post.type as "post"}`)}
        </span>
        {topicLabel && <span className="opacity-55">{topicLabel}</span>}
      </div>

      {post.title && <h1 className="text-2xl font-bold">{post.title}</h1>}
      <p className="mt-1 text-sm opacity-55">
        <Link href={`/u/${post.authorId}`} className="hover:underline">
          {post.authorName}
        </Link>
      </p>

      <p className="mt-4 whitespace-pre-wrap">{post.body}</p>

      <div className="mt-5">
        <LikeButton postId={post.id} initialCount={reactionCount} />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide opacity-50">
          {t("comments")} ({comments.length})
        </h2>
        <ul className="flex flex-col gap-3">
          {comments.map((c) => (
            <li
              key={c.id}
              className="rounded-xl border border-foreground/10 p-4"
            >
              <Link
                href={`/u/${c.authorId}`}
                className="text-sm font-medium hover:underline"
              >
                {c.authorName}
              </Link>
              <p className="mt-1 whitespace-pre-wrap text-sm opacity-80">
                {c.body}
              </p>
            </li>
          ))}
        </ul>

        {user ? (
          <CommentForm postId={post.id} />
        ) : (
          <p className="mt-4 text-sm opacity-60">
            <Link href="/login" className="underline">
              {t("signInToPost")}
            </Link>
          </p>
        )}
      </section>
    </main>
  );
}

import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getPost } from "@/lib/queries/feed";
import { getSessionUser } from "@/lib/auth/session";
import { LikeButton } from "@/components/feed/LikeButton";
import { CommentForm } from "@/components/feed/CommentForm";
import { TOPICS, labelFor } from "@/lib/data/taxonomy";
import { formatRelative } from "@/lib/format/time";
import { Avatar, Badge, Card, buttonClass } from "@/components/ui/kit";

const TYPE_TONE: Record<string, "neutral" | "success" | "accent"> = {
  post: "neutral",
  question: "accent",
  project: "success",
};

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
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6">
      <Card className="p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <Link href={`/u/${post.authorId}`}>
            <Avatar
              name={post.authorName}
              src={post.authorImage}
              seed={post.authorId}
              size={44}
            />
          </Link>
          <div className="min-w-0 flex-1">
            <Link
              href={`/u/${post.authorId}`}
              className="block truncate text-sm font-medium hover:underline"
            >
              {post.authorName}
            </Link>
            <p className="text-xs text-[var(--color-hint)]">
              {formatRelative(post.createdAt, locale)}
            </p>
          </div>
          <Badge tone={TYPE_TONE[post.type] ?? "neutral"}>
            {t(`type.${post.type as "post"}`)}
          </Badge>
        </div>

        {post.title && (
          <h1 className="mt-4 text-xl font-bold leading-snug">{post.title}</h1>
        )}
        <p className="mt-3 whitespace-pre-wrap text-[0.95rem] leading-relaxed">
          {post.body}
        </p>

        <div className="mt-4 flex items-center gap-3">
          <LikeButton postId={post.id} initialCount={reactionCount} />
          {topicLabel && (
            <Link
              href={`/feed?topic=${post.topicSlug}`}
              className="text-sm text-[var(--color-link)] hover:underline"
            >
              #{topicLabel}
            </Link>
          )}
        </div>
      </Card>

      <section className="mt-6">
        <h2 className="px-1 pb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-hint)]">
          {t("comments")} ({comments.length})
        </h2>

        {comments.length > 0 && (
          <ul className="flex flex-col gap-2">
            {comments.map((c) => (
              <li key={c.id}>
                <Card className="p-3.5">
                  <div className="flex items-center gap-2.5">
                    <Link href={`/u/${c.authorId}`}>
                      <Avatar
                        name={c.authorName}
                        src={c.authorImage}
                        seed={c.authorId}
                        size={32}
                      />
                    </Link>
                    <Link
                      href={`/u/${c.authorId}`}
                      className="truncate text-sm font-medium hover:underline"
                    >
                      {c.authorName}
                    </Link>
                    <span className="text-xs text-[var(--color-hint)]">
                      · {formatRelative(c.createdAt, locale)}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--color-foreground)]/85">
                    {c.body}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        )}

        {user ? (
          <CommentForm postId={post.id} />
        ) : (
          <Link
            href="/login"
            className={buttonClass("secondary", "mt-4 w-full sm:w-auto")}
          >
            {t("signInToPost")}
          </Link>
        )}
      </section>
    </main>
  );
}

import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { listPosts, type FeedItem } from "@/lib/queries/feed";
import { TOPICS, labelFor } from "@/lib/data/taxonomy";
import { formatRelative } from "@/lib/format/time";
import {
  Avatar,
  Badge,
  Card,
  Chip,
  EmptyState,
  buttonClass,
  cn,
} from "@/components/ui/kit";

type SearchParams = Record<string, string | string[] | undefined>;

function str(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v || undefined;
}

const TYPE_TONE: Record<string, "neutral" | "success" | "accent"> = {
  post: "neutral",
  question: "accent",
  project: "success",
};

export default async function FeedPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const topic = str(sp.topic);

  const items = await listPosts({ topicSlug: topic });
  const t = await getTranslations("feed");

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Link href="/feed/new" className={buttonClass("primary", "h-10 px-4")}>
          <PlusIcon />
          {t("newPost")}
        </Link>
      </div>

      <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden">
        <Link href="/feed" className="shrink-0">
          <Chip active={!topic}>{t("allTopics")}</Chip>
        </Link>
        {TOPICS.map((tp) => (
          <Link
            key={tp.slug}
            href={`/feed?topic=${tp.slug}`}
            className="shrink-0"
          >
            <Chip active={topic === tp.slug}>
              {labelFor(tp.labels, locale)}
            </Chip>
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <Card className="overflow-hidden">
          <EmptyState
            icon="🗒️"
            title={t("empty")}
            action={
              <Link href="/feed/new" className={buttonClass("secondary")}>
                {t("newPost")}
              </Link>
            }
          />
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((p) => (
            <li key={p.id}>
              <PostCard post={p} locale={locale} typeLabel={t(`type.${p.type as "post"}`)} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function PostCard({
  post: p,
  locale,
  typeLabel,
}: {
  post: FeedItem;
  locale: string;
  typeLabel: string;
}) {
  const topicLabel = p.topicSlug
    ? labelFor(
        TOPICS.find((x) => x.slug === p.topicSlug)?.labels ?? {
          uz: p.topicSlug,
          en: p.topicSlug,
          ru: p.topicSlug,
          tr: p.topicSlug,
        },
        locale,
      )
    : null;

  return (
    <Card className="transition hover:ring-[var(--color-button)]">
      <Link href={`/feed/${p.id}`} className="block p-4">
        <div className="flex items-center gap-3">
          <Avatar
            name={p.authorName}
            src={p.authorImage}
            seed={p.authorId}
            size={40}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{p.authorName}</p>
            <p className="text-xs text-[var(--color-hint)]">
              {formatRelative(p.createdAt, locale)}
            </p>
          </div>
          <Badge tone={TYPE_TONE[p.type] ?? "neutral"}>{typeLabel}</Badge>
        </div>

        {p.title && (
          <h2 className="mt-3 font-semibold leading-snug">{p.title}</h2>
        )}
        <p
          className={cn(
            "line-clamp-4 whitespace-pre-wrap text-sm text-[var(--color-foreground)]/80",
            p.title ? "mt-1" : "mt-3",
          )}
        >
          {p.body}
        </p>

        <div className="mt-3 flex items-center gap-4 text-xs text-[var(--color-hint)]">
          {topicLabel && (
            <span className="truncate text-[var(--color-link)]">
              #{topicLabel}
            </span>
          )}
          <span className="ml-auto inline-flex items-center gap-1.5">
            <HeartIcon />
            {p.reactionCount}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CommentIcon />
            {p.commentCount}
          </span>
        </div>
      </Link>
    </Card>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
    </svg>
  );
}

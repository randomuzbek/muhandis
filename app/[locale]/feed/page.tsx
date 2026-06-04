import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { listPosts } from "@/lib/queries/feed";
import { TOPICS, labelFor } from "@/lib/data/taxonomy";

type SearchParams = Record<string, string | string[] | undefined>;

function str(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v || undefined;
}

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
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Link
          href="/feed/new"
          className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background"
        >
          {t("newPost")}
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <TopicChip href="/feed" active={!topic} label={t("allTopics")} />
        {TOPICS.map((tp) => (
          <TopicChip
            key={tp.slug}
            href={`/feed?topic=${tp.slug}`}
            active={topic === tp.slug}
            label={labelFor(tp.labels, locale)}
          />
        ))}
      </div>

      {items.length === 0 ? (
        <p className="py-12 text-center opacity-60">{t("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((p) => (
            <li key={p.id}>
              <Link
                href={`/feed/${p.id}`}
                className="block rounded-2xl border border-foreground/10 p-5 transition hover:bg-foreground/5"
              >
                <div className="mb-1 flex items-center gap-2 text-xs">
                  <span className="rounded-full bg-foreground/10 px-2 py-0.5">
                    {t(`type.${p.type as "post"}`)}
                  </span>
                  {p.topicSlug && (
                    <span className="opacity-55">
                      {labelFor(
                        TOPICS.find((x) => x.slug === p.topicSlug)?.labels ?? {
                          uz: p.topicSlug,
                          en: p.topicSlug,
                          ru: p.topicSlug,
                          tr: p.topicSlug,
                        },
                        locale,
                      )}
                    </span>
                  )}
                </div>
                {p.title && <h2 className="font-semibold">{p.title}</h2>}
                <p className="mt-1 line-clamp-2 text-sm opacity-75">{p.body}</p>
                <div className="mt-2 flex items-center gap-3 text-xs opacity-55">
                  <span>{p.authorName}</span>
                  <span>💬 {p.commentCount}</span>
                  <span>♥ {p.reactionCount}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function TopicChip({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 text-sm transition ${
        active
          ? "border-transparent bg-foreground text-background"
          : "border-foreground/20 hover:bg-foreground/5"
      }`}
    >
      {label}
    </Link>
  );
}

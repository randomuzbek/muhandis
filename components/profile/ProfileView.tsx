import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ENGINEERING_FIELDS, labelFor } from "@/lib/data/taxonomy";
import type { Profile } from "@/db/schema";

interface Props {
  profile: Profile;
  fieldSlugs: string[];
  skills: string[];
  interests: string[];
  locale: string;
  variant: "self" | "public";
  telegram?: { username: string | null; id: number | null };
}

export async function ProfileView({
  profile,
  fieldSlugs,
  skills,
  interests,
  locale,
  variant,
  telegram,
}: Props) {
  const t = await getTranslations("profile");

  const fieldLabels = fieldSlugs
    .map((slug) => ENGINEERING_FIELDS.find((f) => f.slug === slug))
    .filter(Boolean)
    .map((f) => labelFor(f!.labels, locale));

  const links = (profile.links ?? {}) as Record<string, string>;
  const linkEntries = Object.entries(links).filter(([, v]) => v);

  const connectHref = telegram?.username
    ? `https://t.me/${telegram.username}`
    : telegram?.id
      ? `tg://user?id=${telegram.id}`
      : null;

  return (
    <div className="w-full">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{profile.displayName}</h1>
          {profile.headline && (
            <p className="mt-1 opacity-70">{profile.headline}</p>
          )}
          <p className="mt-1 text-sm opacity-60">
            {[profile.currentRole, profile.company].filter(Boolean).join(" · ")}
          </p>
          <p className="text-sm opacity-60">
            {[profile.city, profile.country].filter(Boolean).join(", ")}
          </p>
        </div>
        {variant === "self" ? (
          <Link
            href="/profile/edit"
            className="shrink-0 rounded-full border border-foreground/20 px-4 py-2 text-sm hover:bg-foreground/5"
          >
            {t("editCta")}
          </Link>
        ) : connectHref ? (
          <a
            href={connectHref}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-full bg-[#229ED9] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            {t("connect")}
          </a>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {profile.openToMentoring && <Badge>{t("openToMentoring")}</Badge>}
        {profile.lookingForCollaborators && (
          <Badge>{t("lookingForCollaborators")}</Badge>
        )}
      </div>

      {fieldLabels.length > 0 && (
        <Section title={t("fields")}>
          <Chips items={fieldLabels} />
        </Section>
      )}
      {skills.length > 0 && (
        <Section title={t("skills")}>
          <Chips items={skills} />
        </Section>
      )}
      {interests.length > 0 && (
        <Section title={t("interests")}>
          <Chips items={interests} />
        </Section>
      )}
      {profile.bio && (
        <Section title={t("bio")}>
          <p className="whitespace-pre-wrap text-sm opacity-80">{profile.bio}</p>
        </Section>
      )}
      {linkEntries.length > 0 && (
        <Section title={t("links")}>
          <ul className="flex flex-col gap-1 text-sm">
            {linkEntries.map(([k, v]) => (
              <li key={k}>
                <span className="opacity-60">{t(k)}: </span>
                <span className="break-all">{v}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide opacity-50">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Chips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((i) => (
        <span key={i} className="rounded-full bg-foreground/10 px-3 py-1 text-sm">
          {i}
        </span>
      ))}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-green-500/15 px-3 py-1 text-sm text-green-600 dark:text-green-400">
      {children}
    </span>
  );
}

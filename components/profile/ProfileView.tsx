import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ENGINEERING_FIELDS, labelFor } from "@/lib/data/taxonomy";
import { countryName } from "@/lib/data/places";
import { profileCompleteness } from "@/lib/profile/completeness";
import {
  Avatar,
  Badge,
  Card,
  Chip,
  ProgressBar,
  SectionHeader,
  buttonClass,
} from "@/components/ui/kit";
import { FollowButton } from "@/components/profile/FollowButton";
import { ShareProfile } from "@/components/profile/ShareProfile";
import type { Profile } from "@/db/schema";

interface Props {
  profile: Profile;
  image?: string | null;
  fieldSlugs: string[];
  skills: string[];
  interests: string[];
  locale: string;
  variant: "self" | "public";
  telegram?: { username: string | null; id: number | null };
  followState?: { isFollowing: boolean; followers: number };
  shareUrl?: string;
}

export async function ProfileView({
  profile,
  image,
  fieldSlugs,
  skills,
  interests,
  locale,
  variant,
  telegram,
  followState,
  shareUrl,
}: Props) {
  const t = await getTranslations("profile");

  const name = profile.displayName || t("anonymous");
  const country = countryName(profile.country, locale);
  const location = [profile.city, country].filter(Boolean).join(", ");
  const roleLine = [profile.currentRole, profile.company]
    .filter(Boolean)
    .join(" · ");

  const fieldLabels = fieldSlugs
    .map((slug) => ENGINEERING_FIELDS.find((f) => f.slug === slug))
    .filter(Boolean)
    .map((f) => labelFor(f!.labels, locale));
  const allFieldChips = [...fieldLabels, ...(profile.customFields ?? [])];

  const links = (profile.links ?? {}) as Record<string, string>;
  const linkEntries = Object.entries(links).filter(([, v]) => v);

  const connectHref = telegram?.username
    ? `https://t.me/${telegram.username}`
    : telegram?.id
      ? `tg://user?id=${telegram.id}`
      : null;

  const { score, missing } =
    variant === "self"
      ? profileCompleteness({ profile, fieldSlugs, skills, image })
      : { score: 1, missing: [] };

  return (
    <div className="w-full">
      {/* Üst kart: avatar + isim + konum + aksiyon */}
      <Card className="p-5">
        <div className="flex items-start gap-4">
          <Avatar name={name} src={image} seed={profile.userId} size={72} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold">{name}</h1>
            {profile.headline && (
              <p className="mt-0.5 text-[var(--color-hint)]">
                {profile.headline}
              </p>
            )}
            {roleLine && <p className="mt-1 text-sm">{roleLine}</p>}
            {location && (
              <p className="text-sm text-[var(--color-hint)]">📍 {location}</p>
            )}
            {variant === "public" && followState && (
              <p className="mt-1 text-sm text-[var(--color-hint)]">
                {followState.followers} {t("followers")}
              </p>
            )}
          </div>
        </div>

        {/* Aksiyonlar */}
        <div className="mt-4 flex flex-wrap gap-2">
          {variant === "self" ? (
            <Link href="/profile/edit" className={buttonClass("secondary")}>
              {t("editCta")}
            </Link>
          ) : (
            <>
              {connectHref && (
                <a
                  href={connectHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClass("primary")}
                >
                  {t("connect")}
                </a>
              )}
              {followState && (
                <FollowButton
                  targetUserId={profile.userId}
                  initialFollowing={followState.isFollowing}
                />
              )}
            </>
          )}
          {shareUrl && (
            <ShareProfile url={shareUrl} name={name} />
          )}
        </div>

        {/* Tamamlanma ölçer (sadece kendi profili) */}
        {variant === "self" && score < 1 && (
          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between text-xs text-[var(--color-hint)]">
              <span>{t("completeness")}</span>
              <span>{Math.round(score * 100)}%</span>
            </div>
            <ProgressBar value={score} />
            {missing.length > 0 && (
              <p className="mt-2 text-xs text-[var(--color-hint)]">
                {t("completeHint")}
              </p>
            )}
          </div>
        )}
      </Card>

      {/* Durum + bayraklar */}
      {(profile.status ||
        profile.openToMentoring ||
        profile.lookingForCollaborators) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {profile.status && (
            <Badge tone="accent">{t(`status.${profile.status}`)}</Badge>
          )}
          {profile.openToMentoring && (
            <Badge tone="success">{t("openToMentoring")}</Badge>
          )}
          {profile.lookingForCollaborators && (
            <Badge tone="success">{t("lookingForCollaborators")}</Badge>
          )}
        </div>
      )}

      {allFieldChips.length > 0 && (
        <Section title={t("fields")}>
          <ChipWrap items={allFieldChips} />
        </Section>
      )}
      {skills.length > 0 && (
        <Section title={t("skills")}>
          <ChipWrap items={skills} />
        </Section>
      )}
      {interests.length > 0 && (
        <Section title={t("interests")}>
          <ChipWrap items={interests} />
        </Section>
      )}
      {profile.bio && (
        <Section title={t("bio")}>
          <Card className="p-4">
            <p className="whitespace-pre-wrap text-sm">{profile.bio}</p>
          </Card>
        </Section>
      )}
      {linkEntries.length > 0 && (
        <Section title={t("links")}>
          <Card className="divide-y divide-[var(--color-separator)]">
            {linkEntries.map(([k, v]) => (
              <a
                key={k}
                href={normalizeUrl(v)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-4 py-3 text-sm hover:bg-[var(--color-secondary)]"
              >
                <span className="text-[var(--color-hint)]">{t(k)}</span>
                <span className="ml-3 truncate text-[var(--color-link)]">
                  {v}
                </span>
              </a>
            ))}
          </Card>
        </Section>
      )}
    </div>
  );
}

function normalizeUrl(v: string): string {
  if (/^https?:\/\//i.test(v)) return v;
  if (v.startsWith("@")) return `https://t.me/${v.slice(1)}`;
  return `https://${v}`;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <SectionHeader>{title}</SectionHeader>
      {children}
    </section>
  );
}

function ChipWrap({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((i) => (
        <Chip key={i}>{i}</Chip>
      ))}
    </div>
  );
}

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getFollowState } from "@/lib/actions/follow";
import { getRoleBadges } from "@/lib/queries/roles";
import { RoleBadge } from "@/components/ui/kit";
import { ProfileView } from "@/components/profile/ProfileView";
import {
  getCachedPublicProfile,
  primaryFieldLabel,
  profileLocation,
} from "@/lib/og/profile";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const [data, t] = await Promise.all([
    getCachedPublicProfile(id),
    getTranslations({ locale, namespace: "profile" }),
  ]);
  if (!data) return {};

  const name = data.profile.displayName || t("anonymous");
  const bits = [
    data.profile.headline,
    primaryFieldLabel(data.fieldSlugs, locale),
    profileLocation(data.profile.city, data.profile.country, locale),
  ].filter(Boolean);
  const description =
    bits.join(" · ") || data.profile.bio || `${name} — Muhandis`;
  const url = `/${locale}/u/${id}`;

  return {
    title: name,
    description,
    openGraph: { type: "profile", title: name, description, url },
    twitter: { card: "summary_large_image", title: name, description },
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const data = await getCachedPublicProfile(id);
  if (!data) notFound();

  const [followState, roleBadges] = await Promise.all([
    getFollowState(id),
    getRoleBadges(id),
  ]);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const shareUrl = `${appUrl}/${locale}/u/${id}`;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-8">
      {roleBadges.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {roleBadges.map((b) => (
            <RoleBadge
              key={b.slug}
              labels={b.labels}
              category={b.category}
              locale={locale}
            />
          ))}
        </div>
      )}
      <ProfileView
        profile={data.profile}
        image={data.image}
        fieldSlugs={data.fieldSlugs}
        skills={data.skills}
        interests={data.interests}
        locale={locale}
        variant="public"
        telegram={data.telegram}
        followState={followState}
        shareUrl={shareUrl}
      />
    </main>
  );
}

import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getPublicProfile } from "@/lib/queries/directory";
import { getFollowState } from "@/lib/actions/follow";
import { ProfileView } from "@/components/profile/ProfileView";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const data = await getPublicProfile(id);
  if (!data) notFound();

  const followState = await getFollowState(id);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const shareUrl = `${appUrl}/${locale}/u/${id}`;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-8">
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

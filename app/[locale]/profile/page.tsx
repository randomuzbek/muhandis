import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { loadMyProfile } from "@/lib/actions/profile";
import { getReferralCount } from "@/lib/queries/referral";
import { inviteLink } from "@/lib/telegram/inviteLink";
import { ProfileView } from "@/components/profile/ProfileView";
import { EmptyState, buttonClass } from "@/components/ui/kit";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/login`);

  const { profile, image, fieldSlugs, skills, interests } =
    await loadMyProfile();
  const t = await getTranslations("profile");

  if (!profile) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10">
        <EmptyState
          icon="👋"
          title={t("empty")}
          action={
            <Link href="/onboarding" className={buttonClass("primary")}>
              {t("createCta")}
            </Link>
          }
        />
      </main>
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const shareUrl = `${appUrl}/${locale}/u/${profile.userId}`;

  const link = inviteLink(profile.userId);
  const invite = link
    ? { link, count: await getReferralCount(profile.userId) }
    : undefined;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-8">
      <ProfileView
        profile={profile}
        image={image}
        fieldSlugs={fieldSlugs}
        skills={skills}
        interests={interests}
        locale={locale}
        variant="self"
        shareUrl={shareUrl}
        invite={invite}
      />
    </main>
  );
}

import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { loadMyProfile } from "@/lib/actions/profile";
import { ProfileView } from "@/components/profile/ProfileView";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/login`);

  const { profile, fieldSlugs, skills, interests } = await loadMyProfile();
  const t = await getTranslations("profile");

  if (!profile) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16 text-center">
        <p className="mb-6 opacity-70">{t("empty")}</p>
        <Link
          href="/onboarding"
          className="rounded-full bg-foreground px-6 py-3 font-medium text-background"
        >
          {t("createCta")}
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <ProfileView
        profile={profile}
        fieldSlugs={fieldSlugs}
        skills={skills}
        interests={interests}
        locale={locale}
        variant="self"
      />
    </main>
  );
}

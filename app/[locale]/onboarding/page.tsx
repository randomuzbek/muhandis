import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { loadMyProfile } from "@/lib/actions/profile";
import { OnboardingWizard } from "@/components/profile/OnboardingWizard";
import { buildProfileInitial, localizedFields } from "@/lib/profile/initial";

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/login`);

  const data = await loadMyProfile();
  const t = await getTranslations("profile");

  const initial = buildProfileInitial({
    ...data,
    fallbackName: user?.name,
  });

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-10">
      <h1 className="text-2xl font-bold">{t("onboardingTitle")}</h1>
      <p className="mb-8 mt-1 text-sm opacity-70">{t("onboardingSubtitle")}</p>
      <OnboardingWizard
        initial={initial}
        fields={localizedFields(locale)}
        greetingName={user?.name ?? ""}
        locale={locale}
      />
    </main>
  );
}

import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { loadMyProfile } from "@/lib/actions/profile";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { buildProfileInitial, localizedFields } from "@/lib/profile/initial";

export default async function EditProfilePage({
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
  const initial = buildProfileInitial({ ...data, fallbackName: user?.name });

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <h1 className="mb-8 text-2xl font-bold">{t("editTitle")}</h1>
      <ProfileForm
        initial={initial}
        fields={localizedFields(locale)}
        mode="edit"
      />
    </main>
  );
}

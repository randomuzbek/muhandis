import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getPublicProfile } from "@/lib/queries/directory";
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

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <ProfileView
        profile={data.profile}
        fieldSlugs={data.fieldSlugs}
        skills={data.skills}
        interests={data.interests}
        locale={locale}
        variant="public"
        telegram={data.telegram}
      />
    </main>
  );
}

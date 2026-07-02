import { getTranslations } from "next-intl/server";
import { brandCard, profileCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/card";
import {
  getCachedPublicProfile,
  primaryFieldLabel,
  profileLocation,
} from "@/lib/og/profile";

export const alt = "Muhandis profili";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const [data, t] = await Promise.all([
    getCachedPublicProfile(id),
    getTranslations({ locale, namespace: "profile" }),
  ]);

  // Profil silinmiş/bulunamadıysa marka kartına düş.
  if (!data) {
    return brandCard({ title: "Muhandis", subtitle: t("anonymous") });
  }

  const name = data.profile.displayName || t("anonymous");
  const initial = (name.trim()[0] || "M").toUpperCase();

  return profileCard({
    name,
    headline: data.profile.headline,
    field: primaryFieldLabel(data.fieldSlugs, locale),
    location: profileLocation(data.profile.city, data.profile.country, locale),
    initial,
  });
}

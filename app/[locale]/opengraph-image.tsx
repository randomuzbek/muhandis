import { getTranslations } from "next-intl/server";
import { brandCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/card";

// Varsayılan marka OG kartı — kendi opengraph-image'ı olmayan tüm rotalar
// (ana sayfa, dizin, istatistik, gizlilik...) bunu devralır.
export const alt = "Muhandis — O'zbek muhandislari hamjamiyati";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [app, home] = await Promise.all([
    getTranslations({ locale, namespace: "app" }),
    getTranslations({ locale, namespace: "home" }),
  ]);
  return brandCard({ title: app("name"), subtitle: home("tagline") });
}

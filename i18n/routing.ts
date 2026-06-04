import { defineRouting } from "next-intl/routing";

// Desteklenen diller: Özbekçe (Latin), İngilizce, Rusça, Türkçe
export const locales = ["uz", "en", "ru", "tr"] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "uz",
  // Mini App içinde dil Telegram language_code'undan gelir; web'de tarayıcı diline göre.
  localeDetection: true,
});

import { cache } from "react";
import { getPublicProfile } from "@/lib/queries/directory";
import { countryName } from "@/lib/data/places";
import { ENGINEERING_FIELDS, labelFor } from "@/lib/data/taxonomy";

// generateMetadata, sayfa render'ı ve OG görsel rotası aynı profili istesin
// diye sorguyu React cache ile sarmalıyoruz (tek render geçişinde tek sorgu).
export const getCachedPublicProfile = cache(getPublicProfile);

/** İlk mühendislik alanının dile göre etiketi (varsa). */
export function primaryFieldLabel(
  fieldSlugs: string[],
  locale: string,
): string | null {
  const slug = fieldSlugs[0];
  if (!slug) return null;
  const f = ENGINEERING_FIELDS.find((x) => x.slug === slug);
  return f ? labelFor(f.labels, locale) : null;
}

/** "Şehir, Ülke" — ikisi de opsiyonel. */
export function profileLocation(
  city: string | null,
  country: string | null,
  locale: string,
): string | null {
  const parts = [city, countryName(country, locale)].filter(
    (s): s is string => Boolean(s && s.trim()),
  );
  return parts.length ? parts.join(", ") : null;
}

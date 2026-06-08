// Ülke kodları (ISO 3166-1 alpha-2). Hedef kitleye yakın ülkeler üstte;
// görünen adlar Intl.DisplayNames ile kullanıcının diline göre üretilir.
// Veritabanına ISO kodu yazılır (ör. "TR").
export const COUNTRY_CODES = [
  "UZ", "TR", "RU", "KZ", "KG", "TJ", "TM", "AZ", "GE", "AM",
  "US", "GB", "DE", "FR", "NL", "IT", "ES", "PT", "BE", "CH",
  "AT", "SE", "NO", "FI", "DK", "IE", "PL", "CZ", "SK", "HU",
  "RO", "BG", "GR", "UA", "BY", "LT", "LV", "EE", "CA", "MX",
  "BR", "AR", "CL", "CN", "JP", "KR", "IN", "PK", "ID", "MY",
  "SG", "TH", "VN", "PH", "AE", "SA", "QA", "KW", "BH", "OM",
  "IL", "EG", "MA", "DZ", "TN", "ZA", "NG", "KE", "AU", "NZ",
] as const;

// ISO kodundan dile göre ülke adı. Sunucu ve istemcide çalışır (Intl.DisplayNames).
export function countryName(iso: string | null | undefined, locale: string): string {
  if (!iso) return "";
  try {
    const dn = new Intl.DisplayNames([locale], { type: "region" });
    return dn.of(iso.toUpperCase()) ?? iso;
  } catch {
    return iso;
  }
}

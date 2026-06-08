// Bağımlılıksız göreli zaman yardımcısı (Intl.RelativeTimeFormat).
// Örn: "5 daqiqa oldin", "2 days ago"...

const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: "second" },
  { amount: 60, unit: "minute" },
  { amount: 24, unit: "hour" },
  { amount: 7, unit: "day" },
  { amount: 4.34524, unit: "week" },
  { amount: 12, unit: "month" },
  { amount: Number.POSITIVE_INFINITY, unit: "year" },
];

export function formatRelative(date: Date | string | number, locale: string): string {
  const d = date instanceof Date ? date : new Date(date);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  let duration = (d.getTime() - Date.now()) / 1000;

  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return rtf.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }
  return rtf.format(Math.round(duration), "year");
}

export function formatDateTime(date: Date | string | number, locale: string): string {
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

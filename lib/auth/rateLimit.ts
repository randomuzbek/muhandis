import "server-only";

// Basit, DB tabanlı hız sınırı: belirli bir zaman penceresinde aynı kullanıcının
// oluşturduğu satır sayısını sayar. Serverless'te in-memory güvenilmez olduğu için
// mevcut tablolar (posts/comments/reports) üzerinden sayım yapılır.

export const RATE_LIMITS = {
  post: { windowMs: 10 * 60 * 1000, max: 8 },
  comment: { windowMs: 5 * 60 * 1000, max: 20 },
  report: { windowMs: 10 * 60 * 1000, max: 10 },
} as const;

export function windowStart(windowMs: number): Date {
  return new Date(Date.now() - windowMs);
}

// count(*) sorgusunun sonucunu eşikle karşılaştırır.
export async function exceeds(
  query: Promise<{ value: number }[]>,
  max: number,
): Promise<boolean> {
  const [row] = await query;
  return Number(row?.value ?? 0) >= max;
}

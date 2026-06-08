import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, referralClaims } from "@/db/schema";
import type { TelegramUser } from "@/lib/telegram/validateInitData";
import { parseRefPayload } from "@/lib/telegram/referral";

// Telegram kullanıcısını users tablosunda bul ya da oluştur; günceli döner.
// startParam: Mini App `?startapp=ref_<userId>` ile açıldığında gelen davet kodu.
export async function upsertTelegramUser(
  tg: TelegramUser,
  startParam?: string | null,
) {
  const fullName = [tg.first_name, tg.last_name].filter(Boolean).join(" ");

  const existing = await db.query.users.findFirst({
    where: eq(users.telegramId, tg.id),
  });

  if (existing) {
    const [updated] = await db
      .update(users)
      .set({
        name: existing.name ?? fullName,
        telegramUsername: tg.username ?? existing.telegramUsername,
        languageCode: tg.language_code ?? existing.languageCode,
        photoUrl: tg.photo_url ?? existing.photoUrl,
        image: existing.image ?? tg.photo_url,
      })
      .where(eq(users.telegramId, tg.id))
      .returning();
    return updated;
  }

  // Yeni kullanıcı — referansı çöz (yalnızca ilk kayıtta atfedilir).
  const referredBy = await resolveReferrer(tg.id, startParam);

  const [created] = await db
    .insert(users)
    .values({
      name: fullName,
      telegramId: tg.id,
      telegramUsername: tg.username,
      languageCode: tg.language_code,
      photoUrl: tg.photo_url,
      image: tg.photo_url,
      referredBy,
    })
    .returning();

  // Bekleyen davet talebi varsa tüket.
  if (referredBy) {
    await db
      .delete(referralClaims)
      .where(eq(referralClaims.telegramId, tg.id))
      .catch(() => {});
  }

  return created;
}

// Referansı iki kaynaktan çözer: doğrudan start_param (ref_<userId>) ya da
// bot /start ile önceden kaydedilmiş bekleyen talep. Geçerli, kendisi olmayan
// bir kullanıcı id'si döner; yoksa null.
async function resolveReferrer(
  telegramId: number,
  startParam?: string | null,
): Promise<string | null> {
  let candidate = parseRefPayload(startParam);

  if (!candidate) {
    const claim = await db.query.referralClaims.findFirst({
      where: eq(referralClaims.telegramId, telegramId),
      columns: { referrerUserId: true },
    });
    candidate = claim?.referrerUserId ?? null;
  }
  if (!candidate) return null;

  const referrer = await db.query.users.findFirst({
    where: eq(users.id, candidate),
    columns: { id: true, telegramId: true },
  });
  // Var olmalı ve kendini davet etmemeli.
  if (!referrer) return null;
  if (referrer.telegramId === telegramId) return null;
  return referrer.id;
}

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import type { TelegramUser } from "@/lib/telegram/validateInitData";

// Telegram kullanıcısını users tablosunda bul ya da oluştur; günceli döner.
export async function upsertTelegramUser(tg: TelegramUser) {
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

  const [created] = await db
    .insert(users)
    .values({
      name: fullName,
      telegramId: tg.id,
      telegramUsername: tg.username,
      languageCode: tg.language_code,
      photoUrl: tg.photo_url,
      image: tg.photo_url,
    })
    .returning();
  return created;
}

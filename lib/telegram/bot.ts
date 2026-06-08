import { Bot, InlineKeyboard } from "grammy";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, referralClaims } from "@/db/schema";
import { botStrings } from "./i18n";
import { parseRefPayload } from "./referral";

let botInstance: Bot | null = null;

// Singleton bot örneği (serverless'te tekrar tekrar oluşturmamak için)
export function getBot(): Bot {
  if (botInstance) return botInstance;

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN tanımlı değil.");
  }

  const bot = new Bot(token);
  registerHandlers(bot);
  botInstance = bot;
  return bot;
}

function registerHandlers(bot: Bot) {
  // Inline web_app butonu doğrudan HTTPS uygulama adresi ister (t.me linki DEĞİL).
  const miniAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  bot.command("start", async (ctx) => {
    const from = ctx.from;
    const s = botStrings(from?.language_code);

    // Deep-link yükü: /start ref_<userId> → daveti kaydet (davet edilen henüz
    // hesap açmadan önce). ctx.match komut sonrası gelen payload'tur.
    const refUserId = parseRefPayload(
      typeof ctx.match === "string" ? ctx.match : undefined,
    );
    if (refUserId && from?.id) {
      await recordReferralClaim(from.id, refUserId);
    }

    const name = from?.first_name ?? "muhandis";
    const keyboard =
      miniAppUrl && miniAppUrl.startsWith("https://")
        ? new InlineKeyboard().webApp(s.openApp, miniAppUrl)
        : undefined;

    await ctx.reply(s.start(name), { reply_markup: keyboard });
  });
}

// /start ref_<userId> geldiğinde daveti "bekleyen" olarak kaydeder.
// Kurallar: davet eden geçerli bir kullanıcı olmalı, kendini davet etmemeli ve
// davet edilen Telegram id'si henüz kayıtlı olmamalı (sonradan atfedilmez).
async function recordReferralClaim(telegramId: number, referrerUserId: string) {
  try {
    const referrer = await db.query.users.findFirst({
      where: eq(users.id, referrerUserId),
      columns: { id: true, telegramId: true },
    });
    if (!referrer || referrer.telegramId === telegramId) return;

    const alreadyJoined = await db.query.users.findFirst({
      where: eq(users.telegramId, telegramId),
      columns: { id: true },
    });
    if (alreadyJoined) return;

    await db
      .insert(referralClaims)
      .values({ telegramId, referrerUserId })
      .onConflictDoNothing(); // ilk davet eden kazanır
  } catch (err) {
    console.error("recordReferralClaim başarısız:", err);
  }
}

// Belirli bir kullanıcıya bildirim göndermek için yardımcı.
export async function notifyUser(telegramId: number, text: string) {
  try {
    await getBot().api.sendMessage(telegramId, text);
  } catch (err) {
    console.error("notifyUser başarısız:", err);
  }
}

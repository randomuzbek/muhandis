import { Bot, InlineKeyboard } from "grammy";

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
  const miniAppUrl = process.env.NEXT_PUBLIC_MINI_APP_URL;

  bot.command("start", async (ctx) => {
    const name = ctx.from?.first_name ?? "muhandis";
    const text =
      `Salom, ${name}! 👋\n\n` +
      `Muhandis — dunyo bo'ylab o'zbek muhandislarini birlashtiruvchi hamjamiyat.\n` +
      `Profilingizni yarating, boshqa muhandislarni toping va savol bering.`;

    const keyboard =
      miniAppUrl && miniAppUrl.startsWith("https://")
        ? new InlineKeyboard().webApp("🚀 Ilovani ochish", miniAppUrl)
        : undefined;

    await ctx.reply(text, { reply_markup: keyboard });
  });
}

// Belirli bir kullanıcıya bildirim göndermek için yardımcı (M3'te kullanılacak)
export async function notifyUser(telegramId: number, text: string) {
  try {
    await getBot().api.sendMessage(telegramId, text);
  } catch (err) {
    console.error("notifyUser başarısız:", err);
  }
}

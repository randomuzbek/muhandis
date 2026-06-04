import "dotenv/config";
import { Bot } from "grammy";

// Telegram bot menü butonunu (Mini App) ve webhook'u ayarlar.
// Çalıştırma: npm run setup:telegram
async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN gerekli.");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl || !appUrl.startsWith("https://")) {
    throw new Error(
      "NEXT_PUBLIC_APP_URL https olmalı (ngrok ya da Vercel URL'si).",
    );
  }
  const miniAppUrl = process.env.NEXT_PUBLIC_MINI_APP_URL || appUrl;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

  const bot = new Bot(token);

  // 1) Mini App menü butonu
  await bot.api.setChatMenuButton({
    menu_button: {
      type: "web_app",
      text: "Muhandis",
      web_app: { url: miniAppUrl },
    },
  });
  console.log("✅ Menü butonu ayarlandı:", miniAppUrl);

  // 2) Webhook
  const webhookUrl = `${appUrl}/api/bot`;
  await bot.api.setWebhook(webhookUrl, {
    secret_token: secret || undefined,
    allowed_updates: ["message", "callback_query"],
  });
  console.log("✅ Webhook ayarlandı:", webhookUrl);

  const info = await bot.api.getWebhookInfo();
  console.log("ℹ️  Webhook bilgisi:", {
    url: info.url,
    pending_update_count: info.pending_update_count,
    last_error_message: info.last_error_message,
  });
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌", err.message ?? err);
    process.exit(1);
  });

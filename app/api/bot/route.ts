import { webhookCallback } from "grammy";
import { getBot } from "@/lib/telegram/bot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Telegram bu uca webhook POST'ları gönderir.
export async function POST(req: Request): Promise<Response> {
  // Webhook gizli token doğrulaması (setWebhook ile ayarlanan secret_token)
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (expected) {
    const provided = req.headers.get("x-telegram-bot-api-secret-token");
    if (provided !== expected) {
      return new Response("forbidden", { status: 403 });
    }
  }

  try {
    const handle = webhookCallback(getBot(), "std/http");
    return await handle(req);
  } catch (err) {
    console.error("Bot webhook hatası:", err);
    return new Response("error", { status: 500 });
  }
}

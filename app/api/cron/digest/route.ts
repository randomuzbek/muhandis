import { getWeeklyStats } from "@/lib/queries/digest";
import { getBot } from "@/lib/telegram/bot";
import { botStrings } from "@/lib/telegram/i18n";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Haftalık dijest: topluluk kanalına/grubuna son 7 günün özetini gönderir.
// Vercel Cron (vercel.json) bu ucu tetikler ve CRON_SECRET ayarlıysa
// `Authorization: Bearer <CRON_SECRET>` başlığını otomatik ekler.
//
// Güvenlik: CRON_SECRET ayarlı olmalı ve eşleşmeli — yoksa uç devre dışıdır.
// Yayın: yalnızca DIGEST_CHAT_ID ayarlıysa mesaj gönderilir (aksi halde dormant).
export async function GET(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json({ ok: false, error: "CRON_SECRET not set" }, { status: 401 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 401 });
  }

  const stats = await getWeeklyStats();

  const chatId = process.env.DIGEST_CHAT_ID;
  let sent = false;
  if (chatId) {
    const locale = process.env.DIGEST_LOCALE ?? "uz";
    const text = botStrings(locale).digest(stats);
    try {
      await getBot().api.sendMessage(chatId, text);
      sent = true;
    } catch (err) {
      console.error("Digest gönderimi başarısız:", err);
    }
  }

  return Response.json({ ok: true, sent, stats });
}

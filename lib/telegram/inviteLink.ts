import "server-only";
import { buildRefPayload } from "./referral";

// Bot kullanıcı adını ortamdan çöz: önce TELEGRAM_BOT_USERNAME, yoksa
// NEXT_PUBLIC_MINI_APP_URL (örn. https://t.me/muhandisapp_bot) içinden ayıkla.
export function botUsername(): string | null {
  const explicit = process.env.TELEGRAM_BOT_USERNAME?.replace(/^@/, "").trim();
  if (explicit) return explicit;
  const miniApp = process.env.NEXT_PUBLIC_MINI_APP_URL;
  const m = miniApp?.match(/t\.me\/([A-Za-z0-9_]+)/);
  return m?.[1] ?? null;
}

// Bir kullanıcının kişisel davet linki: bot sohbetini açar ve /start ref_<id>
// gönderir → bot referansı kaydeder, davet edilen ilk kez hesap açınca atfedilir.
export function inviteLink(userId: string): string | null {
  const username = botUsername();
  if (!username) return null;
  return `https://t.me/${username}?start=${buildRefPayload(userId)}`;
}

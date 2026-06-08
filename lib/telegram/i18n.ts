import { routing } from "@/i18n/routing";

// Bot/bildirim metinleri için bağımsız (next-intl RSC scope'undan bağımsız) sözlük.
// Bot webhook'u ve cron uçlarında next-intl request-scope'u güvenilir değil; bu yüzden
// alıcıya gönderilen Telegram mesajları burada, alıcının diliyle üretilir.

export type BotLocale = (typeof routing.locales)[number]; // "uz" | "en" | "ru" | "tr"

const SUPPORTED = routing.locales as readonly string[];

// Telegram bazen "uz-UZ" gibi bölge ekli kod gönderir — taban dili al.
export function pickLocale(code?: string | null): BotLocale {
  if (code && SUPPORTED.includes(code)) return code as BotLocale;
  const base = code?.split("-")[0];
  if (base && SUPPORTED.includes(base)) return base as BotLocale;
  return routing.defaultLocale as BotLocale;
}

export interface DigestStats {
  newUsers: number;
  newPosts: number;
  newQuestions: number;
  totalUsers: number;
}

interface BotStrings {
  start: (name: string) => string;
  openApp: string;
  notifyComment: (label: string) => string;
  notifyFollow: (name: string) => string;
  postLabelFallback: string;
  someone: string;
  digest: (s: DigestStats) => string;
}

const STRINGS: Record<BotLocale, BotStrings> = {
  uz: {
    start: (name) =>
      `Salom, ${name}! 👋\n\n` +
      `Muhandis — dunyo bo'ylab o'zbek muhandislarini birlashtiruvchi hamjamiyat.\n` +
      `Profilingizni yarating, boshqa muhandislarni toping va savol bering.`,
    openApp: "🚀 Ilovani ochish",
    notifyComment: (label) => `💬 ${label} ostiga yangi izoh qoldirildi.`,
    notifyFollow: (name) => `👤 ${name} sizni kuzata boshladi.`,
    postLabelFallback: "postingiz",
    someone: "Kimdir",
    digest: (s) =>
      `📊 Haftalik Muhandis xulosasi\n\n` +
      `➕ ${s.newUsers} yangi muhandis\n` +
      `📝 ${s.newPosts} yangi e'lon (${s.newQuestions} savol)\n` +
      `👥 Jami: ${s.totalUsers} muhandis\n\n` +
      `Hamjamiyatga hissa qo'shing — profilingizni to'ldiring va savollarga javob bering.`,
  },
  en: {
    start: (name) =>
      `Hi, ${name}! 👋\n\n` +
      `Muhandis — a community uniting Uzbek engineers across the world.\n` +
      `Create your profile, find other engineers and ask questions.`,
    openApp: "🚀 Open the app",
    notifyComment: (label) => `💬 New comment on ${label}.`,
    notifyFollow: (name) => `👤 ${name} started following you.`,
    postLabelFallback: "your post",
    someone: "Someone",
    digest: (s) =>
      `📊 Weekly Muhandis digest\n\n` +
      `➕ ${s.newUsers} new engineers\n` +
      `📝 ${s.newPosts} new posts (${s.newQuestions} questions)\n` +
      `👥 Total: ${s.totalUsers} engineers\n\n` +
      `Help the community grow — complete your profile and answer questions.`,
  },
  ru: {
    start: (name) =>
      `Привет, ${name}! 👋\n\n` +
      `Muhandis — сообщество, объединяющее узбекских инженеров по всему миру.\n` +
      `Создайте профиль, находите других инженеров и задавайте вопросы.`,
    openApp: "🚀 Открыть приложение",
    notifyComment: (label) => `💬 Новый комментарий к ${label}.`,
    notifyFollow: (name) => `👤 ${name} подписался на вас.`,
    postLabelFallback: "вашему посту",
    someone: "Кто-то",
    digest: (s) =>
      `📊 Еженедельная сводка Muhandis\n\n` +
      `➕ ${s.newUsers} новых инженеров\n` +
      `📝 ${s.newPosts} новых публикаций (${s.newQuestions} вопросов)\n` +
      `👥 Всего: ${s.totalUsers} инженеров\n\n` +
      `Помогите сообществу расти — заполните профиль и отвечайте на вопросы.`,
  },
  tr: {
    start: (name) =>
      `Merhaba, ${name}! 👋\n\n` +
      `Muhandis — dünya genelindeki Özbek mühendisleri birleştiren topluluk.\n` +
      `Profilini oluştur, başka mühendisleri bul ve soru sor.`,
    openApp: "🚀 Uygulamayı aç",
    notifyComment: (label) => `💬 ${label} altına yeni yorum yapıldı.`,
    notifyFollow: (name) => `👤 ${name} seni takip etmeye başladı.`,
    postLabelFallback: "gönderin",
    someone: "Biri",
    digest: (s) =>
      `📊 Haftalık Muhandis özeti\n\n` +
      `➕ ${s.newUsers} yeni mühendis\n` +
      `📝 ${s.newPosts} yeni gönderi (${s.newQuestions} soru)\n` +
      `👥 Toplam: ${s.totalUsers} mühendis\n\n` +
      `Topluluğa katkı sun — profilini tamamla ve sorulara yanıt ver.`,
  },
};

export function botStrings(code?: string | null): BotStrings {
  return STRINGS[pickLocale(code)];
}

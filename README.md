# Muhandis

> **Open-source network uniting Uzbek engineers worldwide** — a Telegram Mini App
> + web app with profiles, a searchable directory, a forum, and mentorship.
> Built with Next.js 16, TypeScript, Drizzle ORM and grammY. Contributions welcome —
> see [CONTRIBUTING.md](./CONTRIBUTING.md). Licensed under [MIT](./LICENSE).

Dünya genelinde okuyan/çalışan **Özbek mühendisleri** birleştiren ağ — bir
**Telegram Mini App** (Telegram içinde açılan tam web uygulaması) + aynı koddan
sunulan web sitesi.

- **Profiller & dizin** — kim hangi alanda, nerede, neyle uğraşıyor
- **Forum/akış** — gönderi, soru, proje ilanı, yorum
- **Birebir bağlan** — Telegram DM ile
- 4 dil: Özbekçe (Latin), İngilizce, Rusça, Türkçe

## Teknoloji

Next.js 16 (App Router) · TypeScript · Tailwind v4 · next-intl · Auth.js v5 ·
Drizzle ORM + Postgres (Neon) · grammY (bot) · Telegram Mini App SDK · Vercel.

## Kurulum (yerel)

### 1. Bağımlılıklar
```bash
npm install
cp .env.example .env   # değerleri doldur
```

### 2. Veritabanı (Neon)
1. https://neon.tech → ücretsiz proje → connection string → `.env` `DATABASE_URL`
2. Tabloları oluştur ve taksonomiyi doldur:
```bash
npm run db:migrate
npm run db:seed
```

### 3. Telegram botu (BotFather)
1. Telegram'da **@BotFather** → `/newbot` → token → `.env` `TELEGRAM_BOT_TOKEN`
2. `.env`'e şunları ekle:
   - `AUTH_SECRET` — rastgele uzun string (`openssl rand -base64 32`)
   - `TELEGRAM_WEBHOOK_SECRET` — rastgele string
   - `ADMIN_TELEGRAM_IDS` — kendi Telegram id'in (admin paneli için)

### 4. HTTPS (Mini App zorunlu)
Telegram Mini App ve webhook **HTTPS** ister. Yerelde:
```bash
npm run dev               # http://localhost:3000
npx ngrok http 3000       # https://xxxx.ngrok-free.app
```
`.env` → `NEXT_PUBLIC_APP_URL` ve `NEXT_PUBLIC_MINI_APP_URL` = ngrok HTTPS URL'si.

### 5. Bot menü butonu + webhook
```bash
npm run setup:telegram
```
Bu, Mini App menü butonunu ve `/api/bot` webhook'unu ayarlar. Sonra bota
`/start` yaz → menü butonundan Mini App açılır.

## Komutlar
| Komut | Açıklama |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` / `start` | Üretim derlemesi / sunucu |
| `npm run lint` / `typecheck` | ESLint / TS kontrol |
| `npm run db:generate` | Şemadan migration üret |
| `npm run db:migrate` | Migration'ları uygula |
| `npm run db:seed` | Taksonomiyi (alanlar/konular) doldur |
| `npm run db:studio` | Drizzle Studio (DB görsel arayüz) |
| `npm run setup:telegram` | Bot menü butonu + webhook ayarla |

## Mimari (kısa)
- `app/[locale]/...` — Mini App + web ekranları (onboarding, profil, dizin, feed, admin)
- `app/api/auth/[...nextauth]` — Auth.js · `app/api/bot` — grammY webhook
- `auth.ts` — Auth.js (telegram-miniapp initData / Google / e-posta)
- `db/schema.ts` — Drizzle şema · `lib/queries`, `lib/actions` — sorgu/aksiyonlar
- `lib/telegram/` — initData doğrulama, bot, tema
- `messages/{uz,en,ru,tr}.json` — çeviriler

## Deploy (Vercel)
1. Repo'yu Vercel'e bağla.
2. Tüm `.env` değişkenlerini Vercel ortam değişkeni olarak ekle
   (`NEXT_PUBLIC_APP_URL` = Vercel domaini).
3. Deploy sonrası `npm run db:migrate` (üretim DB'sine) ve `npm run setup:telegram`
   (üretim URL'siyle) çalıştır.

## Telegram grubu & kanalı (manuel)
Mini App'in yanında topluluğu canlı tutmak için:
1. **Grup** oluştur (serbest sohbet/tanışma) → açıklamasına Mini App linkini koy.
2. **Kanal** oluştur (tek yönlü duyurular) → sabit mesaja Mini App linki.
3. Bot menü butonu zaten Mini App'i açıyor.

## Tohumlama (cold-start)
Mini App boşken değersizdir. Açılışta:
1. Kendi çevrenden (Baykar/yurtdışı) ilk ~50-100 mühendisi davet et.
2. Profillerini doldurmalarını sağla → dizin "canlı" görünsün.
3. Grupta birkaç başlangıç gönderisi/sorusu aç.
Yazılı eşik koy (örn. "500 aktif üye olunca X").

## Katkı (Contributing)

Muhandis açık kaynak ve topluluk projesidir — herkes katkı verebilir: kod,
tasarım, çeviri, dokümantasyon, fikir. Başlamak için [CONTRIBUTING.md](./CONTRIBUTING.md).

- 🐛 Hata/öneri → [issue](../../issues) aç
- 🌍 Çeviriler `messages/` altında (uz/en/ru/tr)
- 🔧 PR'dan önce: `npm run typecheck && npm run lint && npm run build`

Topluluk: [t.me/muhandis_hub](https://t.me/muhandis_hub)

## Lisans (License)

[MIT](./LICENSE) — özgürce kullan, değiştir, dağıt.

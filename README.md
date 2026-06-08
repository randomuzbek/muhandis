# Muhandis

> **Open-source network uniting Uzbek engineers worldwide** — a Telegram Mini App
> + web app with profiles, a searchable directory, a forum, and mentorship.
> Built with Next.js 16, TypeScript, Drizzle ORM and grammY. Contributions welcome —
> see [CONTRIBUTING.md](./CONTRIBUTING.md). Licensed under [MIT](./LICENSE).

A network connecting **Uzbek engineers** studying and working across the world — a
**Telegram Mini App** (a full web app that opens inside Telegram) plus a website
served from the same codebase.

- **Profiles & directory** — who works in which field, where, and on what
- **Forum / feed** — posts, questions, project listings, comments
- **Connect 1:1** — via Telegram DM
- 4 languages: Uzbek (Latin), English, Russian, Turkish

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 · next-intl · Auth.js v5 ·
Drizzle ORM + Postgres (Neon) · grammY (bot) · Telegram Mini App SDK · Vercel.

## Local setup

### 1. Dependencies
```bash
npm install
cp .env.example .env   # fill in the values
```

### 2. Database (Neon)
1. https://neon.tech → free project → connection string → `.env` `DATABASE_URL`
2. Create the tables and seed the taxonomy:
```bash
npm run db:migrate
npm run db:seed
```

### 3. Telegram bot (BotFather)
1. In Telegram, **@BotFather** → `/newbot` → token → `.env` `TELEGRAM_BOT_TOKEN`
2. Add to `.env`:
   - `AUTH_SECRET` — a long random string (`openssl rand -base64 32`)
   - `TELEGRAM_WEBHOOK_SECRET` — a random string
   - `ADMIN_TELEGRAM_IDS` — your own Telegram id (for the admin panel)

### 4. HTTPS (required by the Mini App)
Telegram Mini Apps and the webhook require **HTTPS**. Locally:
```bash
npm run dev                          # http://localhost:3000
npx ngrok http 3000                  # https://xxxx.ngrok-free.app
# or: cloudflared tunnel --url http://localhost:3000
```
Set `.env` → `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_MINI_APP_URL` to the HTTPS URL.

### 5. Bot menu button + webhook
```bash
npm run setup:telegram
```
This configures the Mini App menu button and the `/api/bot` webhook. Then send
`/start` to the bot → open the Mini App from the menu button.

## Commands
| Command | Description |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `start` | Production build / server |
| `npm run lint` / `typecheck` | ESLint / TypeScript check |
| `npm run db:generate` | Generate a migration from the schema |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Seed the taxonomy (fields / topics) |
| `npm run db:studio` | Drizzle Studio (visual DB UI) |
| `npm run setup:telegram` | Configure bot menu button + webhook |

## Architecture (brief)
- `app/[locale]/...` — Mini App + web screens (onboarding, profile, directory, feed, admin)
- `app/api/auth/[...nextauth]` — Auth.js · `app/api/bot` — grammY webhook
- `auth.ts` — Auth.js (telegram-miniapp initData / Google / email)
- `db/schema.ts` — Drizzle schema · `lib/queries`, `lib/actions` — queries / actions
- `lib/telegram/` — initData validation, bot, theme
- `components/ui/kit.tsx` — design-system components (Telegram-themed)
- `messages/{uz,en,ru,tr}.json` — translations

## Deploy (Vercel)
1. Connect the repo to Vercel.
2. Add all `.env` variables as Vercel environment variables
   (`NEXT_PUBLIC_APP_URL` = your Vercel domain).
3. After deploy, run `npm run db:migrate` (against the production DB) and
   `npm run setup:telegram` (with the production URL).

## Telegram group & channel (manual)
To keep the community alive alongside the Mini App:
1. Create a **group** (open chat / introductions) → put the Mini App link in its description.
2. Create a **channel** (one-way announcements) → pin the Mini App link.
3. The bot menu button already opens the Mini App.

## Seeding (cold-start)
An empty Mini App has no value. At launch:
1. Invite the first ~50–100 engineers from your own network.
2. Get them to fill in their profiles → the directory looks "alive".
3. Post a few starter questions/posts in the group.
Set a written threshold (e.g. "do X once there are 500 active members").

## Contributing

Muhandis is open source and community-driven — everyone is welcome to contribute:
code, design, translations, docs, ideas. Start with [CONTRIBUTING.md](./CONTRIBUTING.md).

- 🐛 Bugs / ideas → open an [issue](../../issues)
- 🌍 Translations live under `messages/` (uz/en/ru/tr)
- 🔧 Before a PR: `npm run typecheck && npm run lint && npm run build`

Community: [t.me/muhandis_hub](https://t.me/muhandis_hub)

## License

[MIT](./LICENSE) — use, modify and distribute freely.

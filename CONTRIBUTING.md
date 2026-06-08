# Contributing to Muhandis

Thanks for your interest in building **Muhandis** — an open-source network for
Uzbek engineers worldwide. Everyone is welcome to contribute: code, design,
translations, docs, or ideas.

## Ways to contribute

- **Report bugs / suggest features** — open an [issue](../../issues).
- **Improve translations** — the app speaks 4 languages (`uz`, `en`, `ru`, `tr`)
  in `messages/`. Fixes and refinements are very welcome.
- **Pick up an issue** — comment on it so others know you're on it.
- **Improve design / UX, docs, or tests.**

## Local setup

See the [README](./README.md) for full setup (Neon Postgres + Telegram bot).
Quick version:

```bash
npm install
cp .env.example .env      # fill in DATABASE_URL, TELEGRAM_BOT_TOKEN, AUTH_SECRET
npm run db:migrate
npm run db:seed
npm run dev               # + an HTTPS tunnel (cloudflared/ngrok) for the Mini App
```

## Pull requests

1. Fork the repo and create a branch: `git checkout -b feat/short-description`.
2. Keep changes focused; match the existing code style and conventions.
3. Before pushing, make sure these pass:
   ```bash
   npm run typecheck    # tsc --noEmit
   npm run lint         # eslint
   npm run build
   ```
4. Write clear commit messages and a short PR description (what & why).
5. Never commit secrets. `.env` is gitignored — keep it that way.

## Project notes

- **Stack:** Next.js 16 (App Router) · TypeScript · Tailwind v4 · next-intl ·
  Auth.js v5 · Drizzle ORM + Postgres (Neon) · grammY (Telegram bot).
- Database changes go through Drizzle migrations (`npm run db:generate` then
  `npm run db:migrate`).
- Be kind and constructive. This is a community project — treat contributors and
  users with respect.

Rahmat! 🚀

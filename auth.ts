import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users, accounts, sessions, verificationTokens } from "@/db/schema";
import { validateInitData } from "@/lib/telegram/validateInitData";
import { upsertTelegramUser } from "@/lib/auth/upsertTelegramUser";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  // Credentials sağlayıcıları için JWT oturum zorunlu
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [
    Google,
    // Telegram Mini App — initData ile (sürtünmesiz, birincil)
    Credentials({
      id: "telegram-miniapp",
      name: "Telegram Mini App",
      credentials: { initData: { label: "initData", type: "text" } },
      async authorize(credentials) {
        const initData = credentials?.initData;
        if (typeof initData !== "string") return null;
        const token = process.env.TELEGRAM_BOT_TOKEN;
        if (!token) return null;
        try {
          const { user: tgUser, startParam } = validateInitData(initData, token);
          const user = await upsertTelegramUser(tgUser, startParam);
          return {
            id: user.id,
            name: user.name,
            image: user.image,
          };
        } catch {
          return null;
        }
      },
    }),
    // E-posta + şifre (web ikincil)
    Credentials({
      id: "password",
      name: "E-posta",
      credentials: {
        email: { label: "E-posta", type: "email" },
        password: { label: "Şifre", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }
        const user = await db.query.users.findFirst({
          where: eq(users.email, email.toLowerCase()),
        });
        if (!user?.passwordHash) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
  ],
  callbacks: {
    // user.id'yi JWT ve session'a taşı
    async jwt({ token, user }) {
      if (user?.id) token.uid = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token.uid && session.user) {
        session.user.id = token.uid as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});

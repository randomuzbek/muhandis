import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, profiles } from "@/db/schema";
import { notifyUser } from "./bot";
import { botStrings, pickLocale } from "./i18n";

function appLink(locale: string, path: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return `${base}/${locale}/${path}`;
}

async function recipient(
  userId: string,
): Promise<{ telegramId: number; languageCode: string | null } | null> {
  const u = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { telegramId: true, languageCode: true },
  });
  if (!u?.telegramId) return null;
  return { telegramId: u.telegramId, languageCode: u.languageCode };
}

// Postun yazarına yeni yorum bildirimi (alıcının diliyle).
export async function notifyComment(
  authorId: string,
  postId: number,
  title: string | null,
) {
  const to = await recipient(authorId);
  if (!to) return;
  const s = botStrings(to.languageCode);
  const locale = pickLocale(to.languageCode);
  const label = title ? `"${title}"` : s.postLabelFallback;
  await notifyUser(
    to.telegramId,
    `${s.notifyComment(label)}\n${appLink(locale, `feed/${postId}`)}`,
  );
}

// Takip edilen kullanıcıya yeni takipçi bildirimi (alıcının diliyle).
export async function notifyFollow(
  followedUserId: string,
  followerUserId: string,
) {
  const to = await recipient(followedUserId);
  if (!to) return;
  const s = botStrings(to.languageCode);
  const locale = pickLocale(to.languageCode);

  const follower = await db.query.profiles.findFirst({
    where: eq(profiles.userId, followerUserId),
    columns: { displayName: true },
  });
  let name = follower?.displayName ?? null;
  if (!name) {
    const u = await db.query.users.findFirst({
      where: eq(users.id, followerUserId),
      columns: { name: true },
    });
    name = u?.name ?? null;
  }

  await notifyUser(
    to.telegramId,
    `${s.notifyFollow(name || s.someone)}\n${appLink(locale, `u/${followerUserId}`)}`,
  );
}

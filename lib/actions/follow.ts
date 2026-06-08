"use server";

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { follows } from "@/db/schema";
import { getSessionUser, requireUserId } from "@/lib/auth/session";
import { notifyFollow } from "@/lib/telegram/notifications";

export async function toggleFollow(
  targetUserId: string,
): Promise<{ ok: true; following: boolean } | { ok: false; error: string }> {
  let me: string;
  try {
    me = await requireUserId();
  } catch {
    return { ok: false, error: "UNAUTHENTICATED" };
  }
  if (me === targetUserId) return { ok: false, error: "SELF" };

  const existing = await db.query.follows.findFirst({
    where: and(
      eq(follows.followerId, me),
      eq(follows.followingId, targetUserId),
    ),
  });

  if (existing) {
    await db
      .delete(follows)
      .where(
        and(eq(follows.followerId, me), eq(follows.followingId, targetUserId)),
      );
    return { ok: true, following: false };
  }

  await db
    .insert(follows)
    .values({ followerId: me, followingId: targetUserId })
    .onConflictDoNothing();

  // Takip edilene Telegram bildirimi (kendini takip edemez; üstte engellendi)
  void notifyFollow(targetUserId, me);
  return { ok: true, following: true };
}

// Görüntüleyenin hedefi takip edip etmediği + hedefin takipçi sayısı.
export async function getFollowState(targetUserId: string): Promise<{
  isFollowing: boolean;
  followers: number;
}> {
  const me = await getSessionUser();
  const [followersRow] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(follows)
    .where(eq(follows.followingId, targetUserId));

  let isFollowing = false;
  if (me?.id && me.id !== targetUserId) {
    const row = await db.query.follows.findFirst({
      where: and(
        eq(follows.followerId, me.id),
        eq(follows.followingId, targetUserId),
      ),
    });
    isFollowing = !!row;
  }
  return { isFollowing, followers: followersRow?.n ?? 0 };
}

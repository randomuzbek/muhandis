import "server-only";
import { and, count, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { users, posts } from "@/db/schema";
import type { DigestStats } from "@/lib/telegram/i18n";

async function scalar(query: Promise<{ value: number }[]>): Promise<number> {
  const [row] = await query;
  return Number(row?.value ?? 0);
}

// Son 7 günün topluluk özeti (haftalık dijest için).
export async function getWeeklyStats(): Promise<DigestStats> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [newUsers, newPosts, newQuestions, totalUsers] = await Promise.all([
    scalar(
      db
        .select({ value: count() })
        .from(users)
        .where(gte(users.createdAt, since)),
    ),
    scalar(
      db
        .select({ value: count() })
        .from(posts)
        .where(gte(posts.createdAt, since)),
    ),
    scalar(
      db
        .select({ value: count() })
        .from(posts)
        .where(and(gte(posts.createdAt, since), eq(posts.type, "question"))),
    ),
    scalar(db.select({ value: count() }).from(users)),
  ]);

  return { newUsers, newPosts, newQuestions, totalUsers };
}

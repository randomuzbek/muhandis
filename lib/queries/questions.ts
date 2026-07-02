import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { posts, profiles } from "@/db/schema";

// En yeni sorular (admin yönlendirme paneli için). Faz 1: basit son-N listesi.
export async function listOpenQuestions(): Promise<
  { id: number; title: string | null; body: string; authorName: string | null }[]
> {
  return db
    .select({
      id: posts.id,
      title: posts.title,
      body: posts.body,
      authorName: profiles.displayName,
    })
    .from(posts)
    .leftJoin(profiles, eq(profiles.userId, posts.authorId))
    .where(eq(posts.type, "question"))
    .orderBy(desc(posts.createdAt))
    .limit(50);
}

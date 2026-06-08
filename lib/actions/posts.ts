"use server";

import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { posts, comments, reactions, topics, users } from "@/db/schema";
import { requireUserId } from "@/lib/auth/session";
import { notifyUser } from "@/lib/telegram/bot";
import { POST_TYPES } from "@/lib/data/posts";
import { routing } from "@/i18n/routing";

const createSchema = z.object({
  type: z.enum(POST_TYPES).default("post"),
  title: z.string().trim().max(160).optional().or(z.literal("")),
  body: z.string().trim().min(1, "EMPTY").max(8000),
  topicSlug: z.string().trim().optional().or(z.literal("")),
});

export type CreatePostInput = z.input<typeof createSchema>;

export async function createPost(
  input: CreatePostInput,
): Promise<{ ok: true; id: number } | { ok: false; error: string }> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "UNAUTHENTICATED" };
  }

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "INVALID" };
  }
  const data = parsed.data;

  let topicId: number | null = null;
  if (data.topicSlug) {
    const topic = await db.query.topics.findFirst({
      where: eq(topics.slug, data.topicSlug),
    });
    topicId = topic?.id ?? null;
  }

  const [created] = await db
    .insert(posts)
    .values({
      authorId: userId,
      type: data.type,
      title: data.title || null,
      body: data.body,
      topicId,
    })
    .returning({ id: posts.id });

  return { ok: true, id: created.id };
}

const commentSchema = z.object({
  postId: z.number().int().positive(),
  body: z.string().trim().min(1).max(4000),
});

export async function addComment(
  input: z.input<typeof commentSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "UNAUTHENTICATED" };
  }

  const parsed = commentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "INVALID" };
  const { postId, body } = parsed.data;

  const post = await db.query.posts.findFirst({
    where: eq(posts.id, postId),
    columns: { id: true, authorId: true, title: true },
  });
  if (!post) return { ok: false, error: "NOT_FOUND" };

  await db.insert(comments).values({ postId, authorId: userId, body });

  // Yazara Telegram bildirimi (kendisi değilse)
  if (post.authorId !== userId) {
    void notifyPostAuthor(post.authorId, postId, post.title);
  }

  return { ok: true };
}

export async function toggleReaction(
  postId: number,
): Promise<{ ok: true; liked: boolean } | { ok: false; error: string }> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "UNAUTHENTICATED" };
  }

  const existing = await db.query.reactions.findFirst({
    where: and(eq(reactions.postId, postId), eq(reactions.userId, userId)),
  });

  if (existing) {
    await db
      .delete(reactions)
      .where(and(eq(reactions.postId, postId), eq(reactions.userId, userId)));
    return { ok: true, liked: false };
  }

  await db.insert(reactions).values({ postId, userId }).onConflictDoNothing();
  return { ok: true, liked: true };
}

async function notifyPostAuthor(
  authorId: string,
  postId: number,
  title: string | null,
) {
  const author = await db.query.users.findFirst({
    where: eq(users.id, authorId),
    columns: { telegramId: true, languageCode: true },
  });
  if (!author?.telegramId) return;

  const locale =
    author.languageCode &&
    (routing.locales as readonly string[]).includes(author.languageCode)
      ? author.languageCode
      : routing.defaultLocale;
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const link = `${base}/${locale}/feed/${postId}`;
  const label = title ? `"${title}"` : "postingiz";
  await notifyUser(
    author.telegramId,
    `💬 ${label} ostiga yangi izoh qoldirildi.\n${link}`,
  );
}

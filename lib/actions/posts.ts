"use server";

import { z } from "zod";
import { eq, and, count, gte } from "drizzle-orm";
import { db } from "@/db";
import { posts, comments, reactions, topics } from "@/db/schema";
import { requireUserId } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/isAdmin";
import { RATE_LIMITS, windowStart, exceeds } from "@/lib/auth/rateLimit";
import { notifyComment } from "@/lib/telegram/notifications";
import { POST_TYPES } from "@/lib/data/posts";

const createSchema = z.object({
  type: z.enum(POST_TYPES).default("post"),
  title: z.string().trim().max(160).optional().or(z.literal("")),
  body: z.string().trim().min(1, "EMPTY").max(8000),
  topicSlug: z.string().trim().optional().or(z.literal("")),
});

export type CreatePostInput = z.input<typeof createSchema>;

async function resolveTopicId(topicSlug?: string): Promise<number | null> {
  if (!topicSlug) return null;
  const topic = await db.query.topics.findFirst({
    where: eq(topics.slug, topicSlug),
  });
  return topic?.id ?? null;
}

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

  // Hız sınırı (spam koruması)
  const limited = await exceeds(
    db
      .select({ value: count() })
      .from(posts)
      .where(
        and(
          eq(posts.authorId, userId),
          gte(posts.createdAt, windowStart(RATE_LIMITS.post.windowMs)),
        ),
      ),
    RATE_LIMITS.post.max,
  );
  if (limited) return { ok: false, error: "RATE_LIMIT" };

  const topicId = await resolveTopicId(data.topicSlug);

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

const updateSchema = createSchema.extend({
  id: z.number().int().positive(),
});

// Gönderiyi düzenle — yalnızca yazarı.
export async function updatePost(
  input: z.input<typeof updateSchema>,
): Promise<{ ok: true; id: number } | { ok: false; error: string }> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "UNAUTHENTICATED" };
  }

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "INVALID" };
  }
  const data = parsed.data;

  const post = await db.query.posts.findFirst({
    where: eq(posts.id, data.id),
    columns: { id: true, authorId: true },
  });
  if (!post) return { ok: false, error: "NOT_FOUND" };
  if (post.authorId !== userId) return { ok: false, error: "FORBIDDEN" };

  const topicId = await resolveTopicId(data.topicSlug);

  await db
    .update(posts)
    .set({
      type: data.type,
      title: data.title || null,
      body: data.body,
      topicId,
    })
    .where(eq(posts.id, data.id));

  return { ok: true, id: data.id };
}

// Gönderiyi sil — yazarı ya da admin (yorumlar/beğeniler cascade ile silinir).
export async function deletePost(
  postId: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "UNAUTHENTICATED" };
  }

  const post = await db.query.posts.findFirst({
    where: eq(posts.id, postId),
    columns: { id: true, authorId: true },
  });
  if (!post) return { ok: false, error: "NOT_FOUND" };

  if (post.authorId !== userId && !(await isAdmin(userId))) {
    return { ok: false, error: "FORBIDDEN" };
  }

  await db.delete(posts).where(eq(posts.id, postId));
  return { ok: true };
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

  // Hız sınırı (spam koruması)
  const limited = await exceeds(
    db
      .select({ value: count() })
      .from(comments)
      .where(
        and(
          eq(comments.authorId, userId),
          gte(comments.createdAt, windowStart(RATE_LIMITS.comment.windowMs)),
        ),
      ),
    RATE_LIMITS.comment.max,
  );
  if (limited) return { ok: false, error: "RATE_LIMIT" };

  const post = await db.query.posts.findFirst({
    where: eq(posts.id, postId),
    columns: { id: true, authorId: true, title: true },
  });
  if (!post) return { ok: false, error: "NOT_FOUND" };

  await db.insert(comments).values({ postId, authorId: userId, body });

  // Yazara Telegram bildirimi (kendisi değilse)
  if (post.authorId !== userId) {
    void notifyComment(post.authorId, postId, post.title);
  }

  return { ok: true };
}

// Yorumu düzenle — yalnızca yazarı.
export async function updateComment(
  commentId: number,
  body: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "UNAUTHENTICATED" };
  }

  const trimmed = body.trim();
  if (!trimmed || trimmed.length > 4000) return { ok: false, error: "INVALID" };

  const comment = await db.query.comments.findFirst({
    where: eq(comments.id, commentId),
    columns: { id: true, authorId: true },
  });
  if (!comment) return { ok: false, error: "NOT_FOUND" };
  if (comment.authorId !== userId) return { ok: false, error: "FORBIDDEN" };

  await db
    .update(comments)
    .set({ body: trimmed })
    .where(eq(comments.id, commentId));
  return { ok: true };
}

// Yorumu sil — yazarı ya da admin.
export async function deleteComment(
  commentId: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "UNAUTHENTICATED" };
  }

  const comment = await db.query.comments.findFirst({
    where: eq(comments.id, commentId),
    columns: { id: true, authorId: true },
  });
  if (!comment) return { ok: false, error: "NOT_FOUND" };

  if (comment.authorId !== userId && !(await isAdmin(userId))) {
    return { ok: false, error: "FORBIDDEN" };
  }

  await db.delete(comments).where(eq(comments.id, commentId));
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

import "server-only";
import { and, eq, desc, sql, count } from "drizzle-orm";
import { db } from "@/db";
import {
  posts,
  comments,
  reactions,
  topics,
  profiles,
  users,
} from "@/db/schema";
import type { PostType } from "@/lib/data/posts";

export interface FeedFilters {
  topicSlug?: string;
  type?: PostType;
}

export interface FeedItem {
  id: number;
  type: string;
  title: string | null;
  body: string;
  createdAt: Date;
  topicSlug: string | null;
  authorId: string;
  authorName: string;
  authorImage: string | null;
  commentCount: number;
  reactionCount: number;
}

const authorName = sql<string>`coalesce(${profiles.displayName}, ${users.name}, 'Muhandis')`;
const authorImage = sql<string | null>`coalesce(${users.image}, ${users.photoUrl})`;

export async function listPosts(
  filters: FeedFilters,
  limit = 50,
): Promise<FeedItem[]> {
  const conditions = [];
  if (filters.type) conditions.push(eq(posts.type, filters.type));
  if (filters.topicSlug) conditions.push(eq(topics.slug, filters.topicSlug));

  const rows = await db
    .select({
      id: posts.id,
      type: posts.type,
      title: posts.title,
      body: posts.body,
      createdAt: posts.createdAt,
      topicSlug: topics.slug,
      authorId: posts.authorId,
      authorName,
      authorImage,
      commentCount: sql<number>`(select count(*) from ${comments} where ${comments.postId} = ${posts.id})`,
      reactionCount: sql<number>`(select count(*) from ${reactions} where ${reactions.postId} = ${posts.id})`,
    })
    .from(posts)
    .leftJoin(topics, eq(posts.topicId, topics.id))
    .leftJoin(users, eq(posts.authorId, users.id))
    .leftJoin(profiles, eq(posts.authorId, profiles.userId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(posts.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    ...r,
    commentCount: Number(r.commentCount),
    reactionCount: Number(r.reactionCount),
  }));
}

export interface PostComment {
  id: number;
  body: string;
  createdAt: Date;
  authorId: string;
  authorName: string;
  authorImage: string | null;
}

export async function getPost(id: number) {
  const [post] = await db
    .select({
      id: posts.id,
      type: posts.type,
      title: posts.title,
      body: posts.body,
      createdAt: posts.createdAt,
      topicSlug: topics.slug,
      authorId: posts.authorId,
      authorName,
      authorImage,
    })
    .from(posts)
    .leftJoin(topics, eq(posts.topicId, topics.id))
    .leftJoin(users, eq(posts.authorId, users.id))
    .leftJoin(profiles, eq(posts.authorId, profiles.userId))
    .where(eq(posts.id, id))
    .limit(1);

  if (!post) return null;

  const commentRows = await db
    .select({
      id: comments.id,
      body: comments.body,
      createdAt: comments.createdAt,
      authorId: comments.authorId,
      authorName,
      authorImage,
    })
    .from(comments)
    .leftJoin(users, eq(comments.authorId, users.id))
    .leftJoin(profiles, eq(comments.authorId, profiles.userId))
    .where(eq(comments.postId, id))
    .orderBy(comments.createdAt);

  const [{ value: reactionCount }] = await db
    .select({ value: count() })
    .from(reactions)
    .where(eq(reactions.postId, id));

  return {
    post,
    comments: commentRows as PostComment[],
    reactionCount: Number(reactionCount),
  };
}

"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { posts, questionTargets } from "@/db/schema";
import { requireUserId } from "@/lib/auth/session";
import { can } from "@/lib/auth/roles";
import { notifyQuestionTarget } from "@/lib/telegram/notifications";
import { revalidatePath } from "next/cache";

const routeSchema = z.object({
  postId: z.number().int().positive(),
  userId: z.string().min(1),
});

export async function routeQuestion(
  input: z.input<typeof routeSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  let actorId: string;
  try {
    actorId = await requireUserId();
  } catch {
    return { ok: false, error: "UNAUTHENTICATED" };
  }
  if (!(await can(actorId, "content.moderate"))) {
    return { ok: false, error: "FORBIDDEN" };
  }

  const parsed = routeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "INVALID" };
  const { postId, userId } = parsed.data;

  const post = await db.query.posts.findFirst({
    where: eq(posts.id, postId),
    columns: { id: true, type: true, title: true },
  });
  if (!post || post.type !== "question") return { ok: false, error: "NOT_FOUND" };

  await db
    .insert(questionTargets)
    .values({ postId, userId, source: "admin" })
    .onConflictDoNothing();
  void notifyQuestionTarget(userId, postId, post.title);

  revalidatePath("/admin");
  return { ok: true };
}

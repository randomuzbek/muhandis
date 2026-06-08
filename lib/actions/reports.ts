"use server";

import { z } from "zod";
import { and, count, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { reports, posts, comments } from "@/db/schema";
import { requireUserId } from "@/lib/auth/session";
import { adminTelegramIds } from "@/lib/auth/isAdmin";
import { RATE_LIMITS, windowStart, exceeds } from "@/lib/auth/rateLimit";
import { notifyUser } from "@/lib/telegram/bot";
import { routing } from "@/i18n/routing";

const schema = z
  .object({
    postId: z.number().int().positive().optional(),
    commentId: z.number().int().positive().optional(),
    reason: z.string().trim().max(500).optional().or(z.literal("")),
  })
  .refine((d) => d.postId || d.commentId, { message: "NO_TARGET" });

// Bir gönderi ya da yorumu şikayet et. Adminlere bot DM ile bildirilir.
export async function reportContent(
  input: z.input<typeof schema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "UNAUTHENTICATED" };
  }

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "INVALID" };
  const { postId, commentId, reason } = parsed.data;

  // Hız sınırı (şikayet selini önle)
  const limited = await exceeds(
    db
      .select({ value: count() })
      .from(reports)
      .where(
        and(
          eq(reports.reporterId, userId),
          gte(reports.createdAt, windowStart(RATE_LIMITS.report.windowMs)),
        ),
      ),
    RATE_LIMITS.report.max,
  );
  if (limited) return { ok: false, error: "RATE_LIMIT" };

  // Hedefin varlığını doğrula + bağlanacak gönderi id'sini bul
  let linkPostId: number | null = postId ?? null;
  if (commentId && !postId) {
    const c = await db.query.comments.findFirst({
      where: eq(comments.id, commentId),
      columns: { id: true, postId: true },
    });
    if (!c) return { ok: false, error: "NOT_FOUND" };
    linkPostId = c.postId;
  } else if (postId) {
    const p = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
      columns: { id: true },
    });
    if (!p) return { ok: false, error: "NOT_FOUND" };
  }

  await db.insert(reports).values({
    reporterId: userId,
    postId: postId ?? null,
    commentId: commentId ?? null,
    reason: reason || null,
  });

  void notifyAdmins(linkPostId, commentId ?? null, reason || null);
  return { ok: true };
}

async function notifyAdmins(
  postId: number | null,
  commentId: number | null,
  reason: string | null,
) {
  const ids = adminTelegramIds();
  if (ids.length === 0) return;

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const link = postId
    ? `${base}/${routing.defaultLocale}/feed/${postId}`
    : null;
  const target = commentId ? `izoh #${commentId}` : `post #${postId}`;
  const text =
    `🚩 Yangi shikoyat: ${target}` +
    (reason ? `\nSabab: ${reason}` : "") +
    (link ? `\n${link}` : "");

  await Promise.all(ids.map((id) => notifyUser(id, text)));
}

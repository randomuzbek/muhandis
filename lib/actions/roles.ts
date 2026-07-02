"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userRoles, profiles } from "@/db/schema";
import { requireUserId } from "@/lib/auth/session";
import { can } from "@/lib/auth/roles";
import { ROLE_SLUGS, roleDef } from "@/lib/data/roles";
import { revalidatePath } from "next/cache";

const assignSchema = z.object({
  userId: z.string().min(1),
  roleSlug: z.enum(ROLE_SLUGS as [string, ...string[]]),
  topicId: z.number().int().positive().nullable().optional(),
});

export type AssignRoleInput = z.input<typeof assignSchema>;

export async function assignRole(
  input: AssignRoleInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  let actorId: string;
  try {
    actorId = await requireUserId();
  } catch {
    return { ok: false, error: "UNAUTHENTICATED" };
  }
  if (!(await can(actorId, "role.manage"))) {
    return { ok: false, error: "FORBIDDEN" };
  }

  const parsed = assignSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "INVALID" };
  }
  const { userId, roleSlug, topicId } = parsed.data;

  // Kapsam tutarlılığı: 'topic' kapsamlı rol konu ister; 'global' rol konu kabul etmez.
  const def = roleDef(roleSlug);
  if (!def) return { ok: false, error: "INVALID" };
  if (def.scope === "topic" && !topicId)
    return { ok: false, error: "TOPIC_REQUIRED" };
  if (def.scope === "global" && topicId) return { ok: false, error: "INVALID" };

  await db
    .insert(userRoles)
    .values({ userId, roleSlug, topicId: topicId ?? null, grantedBy: actorId })
    .onConflictDoNothing();

  revalidatePath("/admin");
  return { ok: true };
}

export async function revokeRole(
  userRoleId: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  let actorId: string;
  try {
    actorId = await requireUserId();
  } catch {
    return { ok: false, error: "UNAUTHENTICATED" };
  }
  if (!(await can(actorId, "role.manage"))) {
    return { ok: false, error: "FORBIDDEN" };
  }
  if (!Number.isInteger(userRoleId) || userRoleId <= 0) {
    return { ok: false, error: "INVALID" };
  }

  await db.delete(userRoles).where(eq(userRoles.id, userRoleId));
  revalidatePath("/admin");
  return { ok: true };
}

// Admin paneli için mevcut atamalar (kullanıcı görünen adıyla).
export async function listUserRolesForAdmin(): Promise<
  {
    id: number;
    userId: string;
    roleSlug: string;
    topicId: number | null;
    displayName: string | null;
  }[]
> {
  return db
    .select({
      id: userRoles.id,
      userId: userRoles.userId,
      roleSlug: userRoles.roleSlug,
      topicId: userRoles.topicId,
      displayName: profiles.displayName,
    })
    .from(userRoles)
    .leftJoin(profiles, eq(profiles.userId, userRoles.userId));
}

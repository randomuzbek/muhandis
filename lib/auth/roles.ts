import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userRoles } from "@/db/schema";
import { isAdmin } from "@/lib/auth/isAdmin";
import {
  hasPermission,
  type Permission,
  type RoleGrant,
} from "@/lib/auth/permissions";

// Kullanıcının tüm rol atamalarını döndürür (slug + kapsam konusu).
export async function getUserRoles(userId: string): Promise<RoleGrant[]> {
  const rows = await db
    .select({ roleSlug: userRoles.roleSlug, topicId: userRoles.topicId })
    .from(userRoles)
    .where(eq(userRoles.userId, userId));
  return rows;
}

// Yetki kararı: env süper-admin → her zaman izinli; aksi halde rollerden.
export async function can(
  userId: string | undefined,
  permission: Permission,
  ctx?: { topicId?: number | null },
): Promise<boolean> {
  if (!userId) return false;
  if (await isAdmin(userId)) return true;
  const grants = await getUserRoles(userId);
  return hasPermission(grants, permission, ctx);
}

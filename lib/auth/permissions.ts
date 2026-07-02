// Saf yetki mantığı — DB bağımlılığı YOK, bu yüzden birim-test edilebilir.
// DB-destekli sarmalayıcı: lib/auth/roles.ts → can().
import type { RoleSlug } from "@/lib/data/roles";

export type Permission = "content.moderate" | "role.manage";

// Hangi rol hangi yetkilere sahip. Statü/topluluk rolleri yetki taşımaz (yalnız rozet).
export const ROLE_PERMISSIONS: Record<RoleSlug, Permission[]> = {
  admin: ["content.moderate", "role.manage"],
  moderator: ["content.moderate"],
  maintainer: ["content.moderate"], // kapsam (topic) can() katmanında uygulanır
  verified: [],
  mentor: [],
  aksakal: [],
  ambassador: [],
  contributor: [],
};

export type RoleGrant = { roleSlug: string; topicId: number | null };

// grants: kullanıcının rol atamaları. ctx.topicId: eylemin geçtiği konu (varsa).
export function hasPermission(
  grants: RoleGrant[],
  permission: Permission,
  ctx?: { topicId?: number | null },
): boolean {
  for (const g of grants) {
    const perms = ROLE_PERMISSIONS[g.roleSlug as RoleSlug];
    if (!perms || !perms.includes(permission)) continue;
    // Global atama (topicId null) her yerde geçerli.
    if (g.topicId == null) return true;
    // Kapsamlı atama yalnız bağlam konusu eşleşince geçerli.
    if (ctx?.topicId != null && g.topicId === ctx.topicId) return true;
  }
  return false;
}

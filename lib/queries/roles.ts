import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userRoles, roles } from "@/db/schema";

// Bir kullanıcının rollerini rozet için (etiket + kategori) döndürür.
// Tekrarları (aynı rol farklı konu) sadeleştirir.
export async function getRoleBadges(
  userId: string,
): Promise<{ slug: string; labels: Record<string, string>; category: string }[]> {
  const rows = await db
    .select({ slug: roles.slug, labels: roles.labels, category: roles.category })
    .from(userRoles)
    .innerJoin(roles, eq(roles.slug, userRoles.roleSlug))
    .where(eq(userRoles.userId, userId));
  const seen = new Set<string>();
  const out: { slug: string; labels: Record<string, string>; category: string }[] =
    [];
  for (const r of rows) {
    if (seen.has(r.slug)) continue;
    seen.add(r.slug);
    out.push(r);
  }
  return out;
}

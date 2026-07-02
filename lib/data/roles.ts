// Rol kataloğu — tek doğruluk kaynağı. Rol eklemek = buraya satır + db:seed.
// Etiketler db/seed.ts ile `roles` tablosuna yazılır; yetkiler lib/auth/permissions.ts'te.
import type { LocalizedLabel } from "@/lib/data/taxonomy";

export type RoleCategory = "mgmt" | "status" | "community";
export type RoleScope = "global" | "topic";

export type RoleSlug =
  | "admin"
  | "moderator"
  | "maintainer"
  | "verified"
  | "mentor"
  | "aksakal"
  | "ambassador"
  | "contributor";

export interface RoleDef {
  slug: RoleSlug;
  labels: LocalizedLabel;
  category: RoleCategory;
  scope: RoleScope;
}

export const ROLES: RoleDef[] = [
  // Yönetim (yetki taşır)
  { slug: "admin", category: "mgmt", scope: "global", labels: { uz: "Admin", en: "Admin", ru: "Администратор", tr: "Yönetici" } },
  { slug: "moderator", category: "mgmt", scope: "global", labels: { uz: "Hakam", en: "Moderator", ru: "Модератор", tr: "Moderatör" } },
  { slug: "maintainer", category: "mgmt", scope: "topic", labels: { uz: "Mavzu mas'uli", en: "Maintainer", ru: "Куратор темы", tr: "Konu sorumlusu" } },
  // Statü & güven (rozet)
  { slug: "verified", category: "status", scope: "global", labels: { uz: "Tasdiqlangan muhandis", en: "Verified engineer", ru: "Подтверждённый инженер", tr: "Doğrulanmış mühendis" } },
  { slug: "mentor", category: "status", scope: "global", labels: { uz: "Mentor", en: "Mentor", ru: "Ментор", tr: "Mentor" } },
  { slug: "aksakal", category: "status", scope: "global", labels: { uz: "Oqsoqol", en: "Elder", ru: "Аксакал", tr: "Aksakal" } },
  // Topluluk-büyütme (gönüllü)
  { slug: "ambassador", category: "community", scope: "global", labels: { uz: "Hudud elchisi", en: "Regional ambassador", ru: "Региональный посол", tr: "Bölge elçisi" } },
  { slug: "contributor", category: "community", scope: "global", labels: { uz: "Hissador", en: "Contributor", ru: "Контрибьютор", tr: "Katkıcı" } },
];

export const ROLE_SLUGS: RoleSlug[] = ROLES.map((r) => r.slug);

export function roleDef(slug: string): RoleDef | undefined {
  return ROLES.find((r) => r.slug === slug);
}

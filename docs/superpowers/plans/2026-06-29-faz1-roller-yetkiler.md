# Faz 1 · Roller & Yetkiler Temeli — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Topluluğun gönüllüyle büyümesini sağlayan rol & yetki sistemini kur: roller veri olarak tanımlansın, kurucu admin panelinden kullanıcılara rol atayabilsin, moderasyon (içerik silme) yetkisi rollere bağlansın, roller profilde rozet olarak görünsün.

**Architecture:** Roller ve atamalar iki yeni tabloda (`roles`, `user_roles`) yaşar — rol eklemek migration değil, satır eklemektir. Yetki kararı **saf bir fonksiyonda** (`hasPermission`) verilir (DB'siz, birim-test edilebilir); DB-destekli `can()` bu saf fonksiyonu kullanıcının rol kayıtlarıyla besler ve env-tabanlı süper-admin'i (`isAdmin`) onurlandırır. Mevcut `deletePost`/`deleteComment` aksiyonları "yalnızca admin" yerine `can()`'e bağlanır. Admin paneline bir rol-atama bileşeni eklenir.

**Tech Stack:** Next.js 16 (App Router, RSC + server actions), TypeScript, Drizzle ORM + Postgres (Neon HTTP), Zod v4, next-intl (uz/en/ru/tr), Vitest (bu planda kuruluyor).

## Global Constraints

- **Next.js 16.2.7** — kod yazmadan önce ilgili API için `node_modules/next/dist/docs/` okunacak (bu Next sürümü eğitim verisinden farklı olabilir; `AGENTS.md`).
- **Server action dönüş şekli:** her zaman `{ ok: true; ... } | { ok: false; error: string }`. Hata kodları string sabit: `"UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" | "INVALID" | "RATE_LIMIT"`.
- **Auth:** kullanıcı `requireUserId()` (try/catch) ya da `getSessionUser()` ile alınır. Env süper-admin `isAdmin(userId)` ile kontrol edilir.
- **Doğrulama:** Zod `safeParse()` → `.success` kontrolü → `.data` ya da `.issues[0]?.message`.
- **Diller:** etiketler 4 dilli jsonb `{ uz, en, ru, tr }`. Faz 1 içerik dili önce uz+ru ama UI metinleri 4 dilde de eklenir (mevcut `messages/*.json` deseni).
- **DB:** Neon HTTP serverless driver (`@/db` → `db`). Şema `db/schema.ts`; migration `npm run db:generate` ile üretilir, `npm run db:migrate` ile uygulanır.
- **Import alias:** `@/...` proje köküne çözülür.
- **YAGNI:** Faz 1 yetkileri yalnızca `content.moderate` (içerik silme) ve `role.manage`. Pin/throttle/gölge-ban vb. Faz 2/3.

---

## Faz 1 Decomposition (bu plan 1/4)

Faz 1 birden çok alt-sistemden oluşur; her biri kendi başına çalışır/test edilir:

1. **Roller & Yetkiler temeli** ← *bu plan* (her şeyin dayanağı; kullanıcının açık önceliği).
2. Sorular + "Dört Kapı" (herkese açık + belirli kişiye) yönlendirme & admin elle yönlendirme.
3. Konu (Reddit-tarzı) gezinme + basit metin araması (mevcut feed route'larını yeniden etkinleştir/cilala).
4. Telegram bildirim genişlemesi (soru-atandı vb.) + rol-bazlı moderasyon UI'si.

Bu plan tamamlanınca 2/3/4 ayrı planlar olarak yazılacak.

---

## File Structure

**Yeni dosyalar:**
- `vitest.config.ts` — test koşucusu yapılandırması (yalnız saf birim testleri).
- `lib/data/roles.ts` — rol kataloğu (slug, 4-dilli etiket, kategori, kapsam) + türler. Tek doğruluk kaynağı.
- `lib/auth/permissions.ts` — **saf** yetki mantığı: `Permission` türü, `ROLE_PERMISSIONS` haritası, `hasPermission()`. DB bağımlılığı YOK.
- `lib/auth/permissions.test.ts` — `hasPermission()` birim testleri.
- `lib/auth/roles.ts` — DB-destekli: `getUserRoles()`, `can()`.
- `lib/actions/roles.ts` — server action'lar: `assignRole()`, `revokeRole()`, `listUserRolesForAdmin()`.
- `components/admin/RolesAdmin.tsx` — admin paneli rol-atama bileşeni (client).

**Değişen dosyalar:**
- `db/schema.ts` — `roles` + `userRoles` tabloları + relations + export tipleri.
- `db/seed.ts` — rol kataloğunu tohumla.
- `lib/actions/posts.ts` — `deletePost`/`deleteComment` yetkisini `can()`'e bağla.
- `app/[locale]/admin/page.tsx` — RolesAdmin bileşenini ve verisini ekle.
- `components/ui/kit.tsx` — `RoleBadge` bileşeni ekle (rozet gösterimi).
- `messages/uz.json`, `messages/en.json`, `messages/ru.json`, `messages/tr.json` — `admin.roles.*` ve `roles.*` metinleri.
- `package.json` — `test` script'i + `vitest` devDependency.

---

## Task 1: Vitest test koşucusunu kur

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (scripts + devDependencies)
- Test: `lib/auth/__smoke__.test.ts` (geçici duman testi, sonunda silinir)

**Interfaces:**
- Produces: `npm test` komutu (= `vitest run`), `**/*.test.ts` dosyalarını çalıştırır; `@/` alias'ı proje köküne çözülür.

- [ ] **Step 1: Vitest'i kur**

Run:
```bash
npm install -D vitest@^3
```
Expected: `vitest` `devDependencies`'e eklenir, kurulum başarılı.

- [ ] **Step 2: Vitest yapılandırmasını yaz**

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
});
```

- [ ] **Step 3: `test` script'lerini ekle**

`package.json` `scripts` bloğuna ekle (mevcut `typecheck` satırından sonra):
```json
    "test": "vitest run",
    "test:watch": "vitest",
```

- [ ] **Step 4: Geçici duman testi yaz**

Create `lib/auth/__smoke__.test.ts`:
```ts
import { describe, it, expect } from "vitest";

describe("vitest smoke", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Testi çalıştır, geçtiğini doğrula**

Run: `npm test`
Expected: PASS — 1 test dosyası, 1 test geçer.

- [ ] **Step 6: Duman testini sil ve commit'le**

Run:
```bash
rm lib/auth/__smoke__.test.ts
git add vitest.config.ts package.json package-lock.json
git commit -m "build: add vitest test runner for pure-logic unit tests"
```

---

## Task 2: Rol kataloğu verisi

**Files:**
- Create: `lib/data/roles.ts`

**Interfaces:**
- Produces:
  - `type RoleCategory = "mgmt" | "status" | "community"`
  - `type RoleScope = "global" | "topic"`
  - `type RoleSlug = "admin" | "moderator" | "maintainer" | "verified" | "mentor" | "aksakal" | "ambassador" | "contributor"`
  - `interface RoleDef { slug: RoleSlug; labels: LocalizedLabel; category: RoleCategory; scope: RoleScope }`
  - `const ROLES: RoleDef[]` — tüm rollerin tek kaynağı
  - `const ROLE_SLUGS: RoleSlug[]` — slug listesi (Zod enum için)
  - `function roleDef(slug: string): RoleDef | undefined`

- [ ] **Step 1: Rol kataloğunu yaz**

Create `lib/data/roles.ts`:
```ts
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
```

- [ ] **Step 2: Tip doğrulamasını çalıştır**

Run: `npm run typecheck`
Expected: PASS — yeni hata yok (`LocalizedLabel` import'u `@/lib/data/taxonomy`'den çözülür).

- [ ] **Step 3: Commit**

```bash
git add lib/data/roles.ts
git commit -m "feat(roles): add role catalog data module"
```

---

## Task 3: `roles` + `user_roles` şeması ve migration

**Files:**
- Modify: `db/schema.ts`
- Modify: `db/seed.ts`

**Interfaces:**
- Consumes: `ROLES` (Task 2), `topics`/`users` tabloları (mevcut).
- Produces:
  - tablo `roles` (slug PK, labels jsonb, category text, scope text)
  - tablo `userRoles` (id serial PK; userId, roleSlug, topicId nullable, grantedBy, grantedAt; (userId, roleSlug, topicId) NULLS NOT DISTINCT unique)
  - export tipleri `Role`, `UserRole`

- [ ] **Step 1: Şemaya tabloları ekle**

`db/schema.ts` içinde `spotlights` tanımından SONRA, relations bloğundan ÖNCE ekle:
```ts
// ---------------------------------------------------------------------------
// Roller & yetkiler — gönüllüyle büyüyen topluluk için.
// Rol kataloğu lib/data/roles.ts'te; bu tablo db:seed ile doldurulur.
// ---------------------------------------------------------------------------

export const roles = pgTable("roles", {
  slug: text("slug").primaryKey(),
  // Çok dilli etiketler: { uz, en, ru, tr }
  labels: jsonb("labels").$type<Record<string, string>>().notNull(),
  // 'mgmt' | 'status' | 'community'
  category: text("category").notNull(),
  // 'global' | 'topic'
  scope: text("scope").notNull().default("global"),
});

// Bir kullanıcıya verilen rol. topicId yalnız scope='topic' (maintainer) için dolu.
export const userRoles = pgTable(
  "user_roles",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleSlug: text("role_slug")
      .notNull()
      .references(() => roles.slug, { onDelete: "cascade" }),
    topicId: integer("topic_id").references(() => topics.id, {
      onDelete: "cascade",
    }),
    grantedBy: text("granted_by").references(() => users.id, {
      onDelete: "set null",
    }),
    grantedAt: timestamp("granted_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("user_roles_unique_idx")
      .on(t.userId, t.roleSlug, t.topicId)
      .nullsNotDistinct(),
    index("user_roles_user_idx").on(t.userId),
  ],
);
```

- [ ] **Step 2: Export tiplerini ekle**

`db/schema.ts` en altına (mevcut `export type ... Spotlight ...` satırlarının yanına) ekle:
```ts
export type Role = typeof roles.$inferSelect;
export type UserRole = typeof userRoles.$inferSelect;
```

- [ ] **Step 3: Seed'e rol tohumlamayı ekle**

`db/seed.ts`:
- import satırını güncelle:
```ts
import { engineeringFields, topics, roles } from "./schema";
import { ENGINEERING_FIELDS, TOPICS } from "../lib/data/taxonomy";
import { ROLES } from "../lib/data/roles";
```
- `main()` içinde, topics seed bloğundan SONRA ekle:
```ts
  console.log("Seeding roles...");
  for (const r of ROLES) {
    await db
      .insert(roles)
      .values({ slug: r.slug, labels: r.labels, category: r.category, scope: r.scope })
      .onConflictDoUpdate({
        target: roles.slug,
        set: { labels: r.labels, category: r.category, scope: r.scope },
      });
  }
```

- [ ] **Step 4: Migration üret**

Run: `npm run db:generate`
Expected: `db/migrations/` altında yeni bir `00XX_*.sql` dosyası oluşur; içinde `CREATE TABLE "roles"` ve `CREATE TABLE "user_roles"` + unique index bulunur.

- [ ] **Step 5: Migration'ı uygula ve tohumla**

Run:
```bash
npm run db:migrate
npm run db:seed
```
Expected: migrate hatasız uygulanır; seed çıktısında `Seeding roles...` ve `Seed tamamlandı ✅` görünür.

- [ ] **Step 6: Tip doğrulaması + commit**

Run: `npm run typecheck`
Expected: PASS.
```bash
git add db/schema.ts db/seed.ts db/migrations/
git commit -m "feat(roles): add roles + user_roles tables, seed role catalog"
```

---

## Task 4: Saf yetki mantığı (`hasPermission`) — TDD

**Files:**
- Create: `lib/auth/permissions.ts`
- Test: `lib/auth/permissions.test.ts`

**Interfaces:**
- Consumes: `RoleSlug` (Task 2).
- Produces:
  - `type Permission = "content.moderate" | "role.manage"`
  - `const ROLE_PERMISSIONS: Record<RoleSlug, Permission[]>`
  - `type RoleGrant = { roleSlug: string; topicId: number | null }`
  - `function hasPermission(grants: RoleGrant[], permission: Permission, ctx?: { topicId?: number | null }): boolean`

- [ ] **Step 1: Başarısız testi yaz**

Create `lib/auth/permissions.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { hasPermission, type RoleGrant } from "@/lib/auth/permissions";

describe("hasPermission", () => {
  it("global moderator can moderate content anywhere", () => {
    const grants: RoleGrant[] = [{ roleSlug: "moderator", topicId: null }];
    expect(hasPermission(grants, "content.moderate")).toBe(true);
    expect(hasPermission(grants, "content.moderate", { topicId: 5 })).toBe(true);
  });

  it("moderator cannot manage roles", () => {
    const grants: RoleGrant[] = [{ roleSlug: "moderator", topicId: null }];
    expect(hasPermission(grants, "role.manage")).toBe(false);
  });

  it("admin can manage roles and moderate", () => {
    const grants: RoleGrant[] = [{ roleSlug: "admin", topicId: null }];
    expect(hasPermission(grants, "role.manage")).toBe(true);
    expect(hasPermission(grants, "content.moderate", { topicId: 9 })).toBe(true);
  });

  it("maintainer can moderate only within its topic scope", () => {
    const grants: RoleGrant[] = [{ roleSlug: "maintainer", topicId: 7 }];
    expect(hasPermission(grants, "content.moderate", { topicId: 7 })).toBe(true);
    expect(hasPermission(grants, "content.moderate", { topicId: 8 })).toBe(false);
    // bağlam belirsizse (topicId yok) kapsamlı yetki uygulanmaz
    expect(hasPermission(grants, "content.moderate")).toBe(false);
  });

  it("status/community roles grant no permissions", () => {
    const grants: RoleGrant[] = [
      { roleSlug: "mentor", topicId: null },
      { roleSlug: "contributor", topicId: null },
    ];
    expect(hasPermission(grants, "content.moderate", { topicId: 1 })).toBe(false);
    expect(hasPermission(grants, "role.manage")).toBe(false);
  });

  it("no grants → no permission", () => {
    expect(hasPermission([], "content.moderate")).toBe(false);
  });

  it("unknown role slug is ignored", () => {
    const grants: RoleGrant[] = [{ roleSlug: "wizard", topicId: null }];
    expect(hasPermission(grants, "content.moderate")).toBe(false);
  });
});
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu doğrula**

Run: `npm test -- lib/auth/permissions.test.ts`
Expected: FAIL — `@/lib/auth/permissions` modülü bulunamadı / `hasPermission is not a function`.

- [ ] **Step 3: Saf yetki modülünü yaz**

Create `lib/auth/permissions.ts`:
```ts
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
```

- [ ] **Step 4: Testi çalıştır, geçtiğini doğrula**

Run: `npm test -- lib/auth/permissions.test.ts`
Expected: PASS — 7 test geçer.

- [ ] **Step 5: Commit**

```bash
git add lib/auth/permissions.ts lib/auth/permissions.test.ts
git commit -m "feat(roles): pure permission model with hasPermission (TDD)"
```

---

## Task 5: DB-destekli rol sorguları ve `can()`

**Files:**
- Create: `lib/auth/roles.ts`

**Interfaces:**
- Consumes: `db` (`@/db`), `userRoles` (`@/db/schema`), `isAdmin` (`@/lib/auth/isAdmin`), `hasPermission`/`Permission`/`RoleGrant` (Task 4).
- Produces:
  - `async function getUserRoles(userId: string): Promise<RoleGrant[]>`
  - `async function can(userId: string | undefined, permission: Permission, ctx?: { topicId?: number | null }): Promise<boolean>`

- [ ] **Step 1: Modülü yaz**

Create `lib/auth/roles.ts`:
```ts
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
```

- [ ] **Step 2: Tip doğrulaması**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add lib/auth/roles.ts
git commit -m "feat(roles): db-backed getUserRoles + can() permission check"
```

---

## Task 6: Rol atama/kaldırma server action'ları (yalnız `role.manage`)

**Files:**
- Create: `lib/actions/roles.ts`

**Interfaces:**
- Consumes: `requireUserId`, `can`, `ROLE_SLUGS`/`roleDef`, `db`, `roles`/`userRoles`/`topics`.
- Produces:
  - `type AssignRoleInput = { userId: string; roleSlug: string; topicId?: number | null }`
  - `async function assignRole(input): Promise<{ ok: true } | { ok: false; error: string }>`
  - `async function revokeRole(userRoleId: number): Promise<{ ok: true } | { ok: false; error: string }>`
  - `async function listUserRolesForAdmin(): Promise<{ id: number; userId: string; roleSlug: string; topicId: number | null; displayName: string | null }[]>`

- [ ] **Step 1: Modülü yaz**

Create `lib/actions/roles.ts`:
```ts
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
  if (def.scope === "topic" && !topicId) return { ok: false, error: "TOPIC_REQUIRED" };
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
```

- [ ] **Step 2: Tip doğrulaması**

Run: `npm run typecheck`
Expected: PASS. (Not: `z.enum(ROLE_SLUGS as [string, ...string[]])` — Zod enum sabit dizi tipi ister; cast bu yüzden.)

- [ ] **Step 3: Commit**

```bash
git add lib/actions/roles.ts
git commit -m "feat(roles): assignRole/revokeRole/listUserRolesForAdmin actions (role.manage gated)"
```

---

## Task 7: Moderasyon yetkisini `can()`'e bağla

**Files:**
- Modify: `lib/actions/posts.ts`

**Interfaces:**
- Consumes: `can` (Task 5).
- Değişiklik: `deletePost` ve `deleteComment` artık yazar + env-admin'e ek olarak `content.moderate` yetkisi olan rolleri (global moderatör, ilgili konunun maintainer'ı) kabul eder.

- [ ] **Step 1: `can` import'unu ekle**

`lib/actions/posts.ts` üst importlarına ekle (mevcut `isAdmin` import'unun altına):
```ts
import { can } from "@/lib/auth/roles";
```

- [ ] **Step 2: `deletePost` yetki kontrolünü güncelle**

`deletePost` içinde, post sorgusu `columns` alanına `topicId` ekle ve yetki kontrolünü değiştir.

Eski:
```ts
  const post = await db.query.posts.findFirst({
    where: eq(posts.id, postId),
    columns: { id: true, authorId: true },
  });
  if (!post) return { ok: false, error: "NOT_FOUND" };

  if (post.authorId !== userId && !(await isAdmin(userId))) {
    return { ok: false, error: "FORBIDDEN" };
  }
```
Yeni:
```ts
  const post = await db.query.posts.findFirst({
    where: eq(posts.id, postId),
    columns: { id: true, authorId: true, topicId: true },
  });
  if (!post) return { ok: false, error: "NOT_FOUND" };

  // Yazar her zaman; aksi halde içerik-moderasyon yetkisi (admin/moderatör/konu maintainer'ı).
  if (
    post.authorId !== userId &&
    !(await can(userId, "content.moderate", { topicId: post.topicId }))
  ) {
    return { ok: false, error: "FORBIDDEN" };
  }
```

- [ ] **Step 3: `deleteComment` yetki kontrolünü güncelle**

`deleteComment` içinde yorumun ait olduğu post'un `topicId`'sini çek ve yetkiyi `can()`'e bağla.

Eski:
```ts
  const comment = await db.query.comments.findFirst({
    where: eq(comments.id, commentId),
    columns: { id: true, authorId: true },
  });
  if (!comment) return { ok: false, error: "NOT_FOUND" };

  if (comment.authorId !== userId && !(await isAdmin(userId))) {
    return { ok: false, error: "FORBIDDEN" };
  }
```
Yeni:
```ts
  const comment = await db.query.comments.findFirst({
    where: eq(comments.id, commentId),
    columns: { id: true, authorId: true, postId: true },
  });
  if (!comment) return { ok: false, error: "NOT_FOUND" };

  if (comment.authorId !== userId) {
    const parent = await db.query.posts.findFirst({
      where: eq(posts.id, comment.postId),
      columns: { topicId: true },
    });
    if (!(await can(userId, "content.moderate", { topicId: parent?.topicId ?? null }))) {
      return { ok: false, error: "FORBIDDEN" };
    }
  }
```

- [ ] **Step 4: `isAdmin` hâlâ kullanılıyor mu kontrol et**

Run: `npm run lint`
Expected: PASS — `isAdmin` posts.ts'te başka yerde kullanılıyorsa (ör. `updatePost`) import kalır; kullanılmıyorsa lint "unused" uyarısı verir → o durumda `isAdmin` import'unu kaldır.

- [ ] **Step 5: Tip doğrulaması + build**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/actions/posts.ts
git commit -m "feat(roles): gate post/comment deletion on can(content.moderate) with topic scope"
```

---

## Task 8: Admin paneli rol-atama bileşeni

**Files:**
- Create: `components/admin/RolesAdmin.tsx`
- Modify: `app/[locale]/admin/page.tsx`
- Modify: `messages/uz.json`, `messages/en.json`, `messages/ru.json`, `messages/tr.json`

**Interfaces:**
- Consumes: `assignRole`, `revokeRole`, `listUserRolesForAdmin` (Task 6); `ROLES` (Task 2); admin sayfasındaki mevcut `listProfilesForPicker()` (kullanıcı seçici — SpotlightAdmin ile aynı kaynak).
- Produces: admin sayfasında çalışan rol atama/kaldırma arayüzü.

- [ ] **Step 1: i18n metinlerini ekle**

Her dört `messages/*.json` dosyasına `admin` nesnesi altına `roles` anahtarı ekle. **uz** (`messages/uz.json`):
```json
    "roles": {
      "title": "Rollar",
      "assign": "Rol berish",
      "remove": "Olib tashlash",
      "pickUser": "Foydalanuvchi",
      "pickRole": "Rol",
      "pickTopic": "Mavzu (faqat mas'ul uchun)",
      "current": "Joriy rollar",
      "empty": "Hali rol berilmagan"
    }
```
**en** (`messages/en.json`):
```json
    "roles": {
      "title": "Roles",
      "assign": "Assign role",
      "remove": "Remove",
      "pickUser": "User",
      "pickRole": "Role",
      "pickTopic": "Topic (maintainer only)",
      "current": "Current roles",
      "empty": "No roles assigned yet"
    }
```
**ru** (`messages/ru.json`):
```json
    "roles": {
      "title": "Роли",
      "assign": "Назначить роль",
      "remove": "Удалить",
      "pickUser": "Пользователь",
      "pickRole": "Роль",
      "pickTopic": "Тема (только для куратора)",
      "current": "Текущие роли",
      "empty": "Роли ещё не назначены"
    }
```
**tr** (`messages/tr.json`):
```json
    "roles": {
      "title": "Roller",
      "assign": "Rol ata",
      "remove": "Kaldır",
      "pickUser": "Kullanıcı",
      "pickRole": "Rol",
      "pickTopic": "Konu (yalnız konu sorumlusu)",
      "current": "Mevcut roller",
      "empty": "Henüz rol atanmadı"
    }
```
(Her dosyada `admin` nesnesinin içine, mevcut alt-anahtarların yanına ekle; JSON virgül kurallarına dikkat et.)

- [ ] **Step 2: RolesAdmin bileşenini yaz**

Create `components/admin/RolesAdmin.tsx`:
```tsx
"use client";

import { useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { assignRole, revokeRole } from "@/lib/actions/roles";
import { ROLES } from "@/lib/data/roles";
import { labelFor } from "@/lib/data/taxonomy";
import { Card, SectionHeader, buttonClass, fieldClass, Chip } from "@/components/ui/kit";

type ProfileOption = { userId: string; displayName: string | null };
type TopicOption = { id: number; slug: string; labels: Record<string, string> };
type RoleAssignment = {
  id: number;
  userId: string;
  roleSlug: string;
  topicId: number | null;
  displayName: string | null;
};

export function RolesAdmin({
  profiles,
  topics,
  assignments,
}: {
  profiles: ProfileOption[];
  topics: TopicOption[];
  assignments: RoleAssignment[];
}) {
  const t = useTranslations("admin.roles");
  const locale = useLocale();
  const [userId, setUserId] = useState("");
  const [roleSlug, setRoleSlug] = useState<string>(ROLES[0]?.slug ?? "");
  const [topicId, setTopicId] = useState<string>("");
  const [pending, startTransition] = useTransition();

  const selectedRole = ROLES.find((r) => r.slug === roleSlug);
  const needsTopic = selectedRole?.scope === "topic";

  function onAssign() {
    if (!userId || !roleSlug) return;
    startTransition(async () => {
      await assignRole({
        userId,
        roleSlug,
        topicId: needsTopic && topicId ? Number(topicId) : null,
      });
      setUserId("");
      setTopicId("");
    });
  }

  return (
    <Card>
      <SectionHeader>{t("title")}</SectionHeader>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          {t("pickUser")}
          <select className={fieldClass} value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">—</option>
            {profiles.map((p) => (
              <option key={p.userId} value={p.userId}>
                {p.displayName || p.userId.slice(0, 8)}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm">
          {t("pickRole")}
          <select className={fieldClass} value={roleSlug} onChange={(e) => setRoleSlug(e.target.value)}>
            {ROLES.map((r) => (
              <option key={r.slug} value={r.slug}>
                {labelFor(r.labels, locale)}
              </option>
            ))}
          </select>
        </label>

        {needsTopic && (
          <label className="grid gap-1 text-sm sm:col-span-2">
            {t("pickTopic")}
            <select className={fieldClass} value={topicId} onChange={(e) => setTopicId(e.target.value)}>
              <option value="">—</option>
              {topics.map((tp) => (
                <option key={tp.id} value={tp.id}>
                  {labelFor(tp.labels, locale)}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <button
        className={buttonClass("primary", "mt-3")}
        disabled={pending || !userId || (needsTopic && !topicId)}
        onClick={onAssign}
      >
        {t("assign")}
      </button>

      <div className="mt-5">
        <SectionHeader>{t("current")}</SectionHeader>
        {assignments.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--color-hint)]">{t("empty")}</p>
        ) : (
          <ul className="mt-2 grid gap-2">
            {assignments.map((a) => {
              const def = ROLES.find((r) => r.slug === a.roleSlug);
              return (
                <li key={a.id} className="flex items-center justify-between gap-2">
                  <span className="text-sm">
                    {a.displayName || a.userId.slice(0, 8)}{" "}
                    <Chip>{def ? labelFor(def.labels, locale) : a.roleSlug}</Chip>
                    {a.topicId != null && (
                      <span className="text-[var(--color-hint)]"> · #{a.topicId}</span>
                    )}
                  </span>
                  <button
                    className={buttonClass("ghost")}
                    disabled={pending}
                    onClick={() => startTransition(async () => { await revokeRole(a.id); })}
                  >
                    {t("remove")}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
}
```

- [ ] **Step 3: Admin sayfasına veriyi yükle ve bileşeni mount et**

`app/[locale]/admin/page.tsx`:
- importları ekle:
```ts
import { listUserRolesForAdmin } from "@/lib/actions/roles";
import { RolesAdmin } from "@/components/admin/RolesAdmin";
import { db } from "@/db";
import { topics } from "@/db/schema";
```
  (Eğer `listProfilesForPicker`/`db`/`topics` zaten import edilmişse tekrar ekleme.)
- Paralel veri yükleme bloğuna rol atamalarını ve konuları ekle. Mevcut `Promise.all([...])` çağrısına `listUserRolesForAdmin()` ve `db.select().from(topics)` ekle, sonuçları al:
```ts
  const [stats, pickerProfiles, spotlightList, roleAssignments, topicList] =
    await Promise.all([
      getAdminStats(),
      listProfilesForPicker(),
      listSpotlights(),
      listUserRolesForAdmin(),
      db.select().from(topics),
    ]);
```
  (Mevcut değişken adları farklıysa onlara uyarla — yalnız son iki çağrıyı ekliyorsun.)
- JSX'te `SpotlightAdmin` bileşeninin yanına/altına ekle:
```tsx
        <RolesAdmin
          profiles={pickerProfiles}
          topics={topicList}
          assignments={roleAssignments}
        />
```

- [ ] **Step 4: Build + doğrulama**

Run: `npm run typecheck && npm run lint && npm run build`
Expected: hepsi PASS. (`labelFor` ve `fieldClass`/`buttonClass`/`Card`/`SectionHeader`/`Chip` imzalarının mevcut export'larla eşleştiğini doğrula.)

- [ ] **Step 5: Manuel doğrulama**

Run: `npm run dev` → admin Telegram id'siyle Mini App/web'den `/<locale>/admin`'e gir.
Expected: "Roller" kartı görünür; bir kullanıcı + rol seç, "Rol ata" bas → atama "Mevcut roller" listesinde belirir; "Konu sorumlusu" seçince konu açılır listesi çıkar; "Kaldır" atamayı siler.

- [ ] **Step 6: Commit**

```bash
git add components/admin/RolesAdmin.tsx app/[locale]/admin/page.tsx messages/uz.json messages/en.json messages/ru.json messages/tr.json
git commit -m "feat(roles): admin role-assignment panel + i18n"
```

---

## Task 9: Rol rozetlerini göster (profil & yazar)

**Files:**
- Modify: `components/ui/kit.tsx` (yeni `RoleBadge`)
- Create: `lib/queries/roles.ts` (`getRoleBadges`)
- Modify: `messages/*.json` (rol açıklaması gerekmez — etiketler DB'den; yalnız başlık)

**Interfaces:**
- Consumes: `db`, `userRoles`, `roles` (mevcut); `labelFor` (taxonomy).
- Produces:
  - `async function getRoleBadges(userId: string): Promise<{ slug: string; labels: Record<string,string>; category: string }[]>`
  - `<RoleBadge labels category locale />` bileşeni.

- [ ] **Step 1: Rozet sorgusunu yaz**

Create `lib/queries/roles.ts`:
```ts
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userRoles, roles } from "@/db/schema";

// Bir kullanıcının rollerini rozet için (etiket + kategori) döndürür. Tekrarları (aynı rol farklı konu) sadeleştirir.
export async function getRoleBadges(
  userId: string,
): Promise<{ slug: string; labels: Record<string, string>; category: string }[]> {
  const rows = await db
    .select({ slug: roles.slug, labels: roles.labels, category: roles.category })
    .from(userRoles)
    .innerJoin(roles, eq(roles.slug, userRoles.roleSlug))
    .where(eq(userRoles.userId, userId));
  const seen = new Set<string>();
  const out: { slug: string; labels: Record<string, string>; category: string }[] = [];
  for (const r of rows) {
    if (seen.has(r.slug)) continue;
    seen.add(r.slug);
    out.push(r);
  }
  return out;
}
```

- [ ] **Step 2: `RoleBadge` bileşenini ekle**

`components/ui/kit.tsx` içine, mevcut `Badge` tanımının yanına ekle:
```tsx
// Rol rozeti — kategoriye göre ton. mgmt=accent, status=success, community=neutral.
export function RoleBadge({
  labels,
  category,
  locale,
}: {
  labels: Record<string, string>;
  category: string;
  locale: string;
}) {
  const tone =
    category === "mgmt" ? "accent" : category === "status" ? "success" : "neutral";
  const label = labels[locale] ?? labels.en ?? Object.values(labels)[0] ?? "";
  return <Badge tone={tone as "neutral" | "success" | "accent"}>{label}</Badge>;
}
```

- [ ] **Step 3: Profil sayfasında rozetleri göster**

`app/[locale]/u/[id]/page.tsx` (public profil) içinde:
- import: `import { getRoleBadges } from "@/lib/queries/roles"; import { RoleBadge } from "@/components/ui/kit";`
- profil verisi yüklenirken: `const roleBadges = await getRoleBadges(profileUserId);` (mevcut profil user id değişkenine uyarla)
- ada/başlığa yakın JSX'e:
```tsx
        {roleBadges.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {roleBadges.map((b) => (
              <RoleBadge key={b.slug} labels={b.labels} category={b.category} locale={locale} />
            ))}
          </div>
        )}
```

- [ ] **Step 4: Build + doğrulama**

Run: `npm run typecheck && npm run lint && npm run build`
Expected: PASS.

- [ ] **Step 5: Manuel doğrulama**

`npm run dev` → Task 8'de rol atadığın kullanıcının `/<locale>/u/<id>` sayfasına gir.
Expected: ad altında rol rozet(ler)i görünür (mgmt=accent, status=success, community=neutral tonunda).

- [ ] **Step 6: Commit**

```bash
git add components/ui/kit.tsx lib/queries/roles.ts app/[locale]/u/[id]/page.tsx
git commit -m "feat(roles): display role badges on public profile"
```

---

## Self-Review Notları (yazar tarafından kontrol edildi)

- **Spec §7 (roller) kapsamı:** 8 rol (mgmt/status/community) kataloğa + tabloya + seed'e + rozete kadar uçtan uca işlendi (Task 2,3,9). Kafil **bilinçli** dışarıda (spec: Faz 2).
- **Spec §6.3 (rol atama paneli):** Task 8.
- **Spec §9 Faz 1 madde 5 (rol sistemi + atama paneli + moderasyon yetkileri):** Task 4-8.
- **Spec §9 madde 8 (rol-bazlı silme):** Task 7.
- **"Rol = veri, kod değil":** yeni rol = `lib/data/roles.ts`'e satır + `db:seed`; yetki gerekiyorsa `ROLE_PERMISSIONS`'a tek satır. Migration gerekmez.
- **Tip tutarlılığı:** `RoleGrant`/`Permission`/`RoleSlug` tüm tasklarda aynı; `can()` imzası Task 5'te tanımlı, Task 7'de aynı kullanılıyor.
- **Test gerçeği:** proje test altyapısı yoktu → Task 1 vitest kurar; saf mantık (Task 4) gerçek TDD; DB/UI taskları typecheck/lint/build + manuel doğrulama (Neon serverless'ta birim DB testi maliyetli, Faz 1 için YAGNI).
- **Kapsam dışı (sonraki planlar):** sorular/Dört Kapı, konu gezinme/arama, bildirim genişlemesi, moderasyon UI'si.

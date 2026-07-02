# Faz 1 · Sorular & Dört Kapı (Plan 2/4) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline) to implement task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Soru soran kişi sorusunu **kime** sorduğunu seçebilsin — Faz 1'de iki kapı: **herkese açık** (varsayılan) ve **belirli kişiye**; ayrıca kurucu admin panelinden açık bir soruyu **elle bir kişiye yönlendirebilsin**. Hedeflenen kişiye Telegram'dan bildirim gider.

**Architecture:** Sorular zaten `posts.type='question'`. Hedefleme ayrı bir `question_targets` tablosunda yaşar (soru → hedef kullanıcı, kaynak `asker|admin`). Soru oluştururken "belirli kişiye" seçilirse `createPost` bir hedef satırı açar ve hedefe bot DM atar. Admin paneline açık soruları bir kişiye yönlendiren küçük bir araç eklenir. Cevaplama mevcut yorum akışıyla yapılır (yeni şey gerekmez).

**Tech Stack:** Next.js 16, TypeScript, Drizzle/Postgres (Neon), Zod v4, grammY (bot DM), next-intl. Etikete-hedefli kapı ve Üstlen/Pas bot akışı **Faz 2** (kapsam dışı).

## Global Constraints

- Server action dönüş şekli: `{ ok: true; ... } | { ok: false; error: string }`. Hata kodları string sabit.
- Auth: `requireUserId()` / `getSessionUser()`; admin `isAdmin()` veya `can(userId, "content.moderate")`.
- Bot bildirimleri `lib/telegram/i18n.ts` sözlüğünden (next-intl RSC scope'u değil), alıcının diliyle.
- Bildirim ateşle-unut: `void notifyX(...)` (createPost'taki `notifyComment` deseni).
- DB: `@/db`; migration `npm run db:generate` → `npm run db:migrate`.
- Diller: UI metinleri 4 dilde (uz/en/ru/tr) `messages/*.json`.

---

## File Structure

**Yeni:**
- `lib/queries/questions.ts` — `listOpenQuestions()` (admin yönlendirme için açık sorular).

**Değişen:**
- `db/schema.ts` — `questionTargets` tablosu + `QuestionTarget` tipi.
- `lib/telegram/i18n.ts` — `notifyQuestion(label)` bot metni (4 dil) + `BotStrings` arayüzü.
- `lib/telegram/notifications.ts` — `notifyQuestionTarget(targetUserId, postId, title)`.
- `lib/actions/posts.ts` — `createPost` opsiyonel `targetUserId` (question + belirli kişiye → hedef satırı + bildirim).
- `lib/actions/questions.ts` — **yeni dosya** `routeQuestion({ postId, userId })` (admin).
- `components/feed/NewPostForm.tsx` — soru tipi seçilince **kapı seçici** (herkese açık / belirli kişiye + kullanıcı seçimi).
- `app/[locale]/feed/new/page.tsx` — profil listesini yükle, forma geçir.
- `components/admin/RouteQuestionAdmin.tsx` — **yeni** admin yönlendirme aracı.
- `app/[locale]/admin/page.tsx` — açık soruları yükle + RouteQuestionAdmin mount.
- `messages/{uz,en,ru,tr}.json` — `feed.audience.*` ve `admin.route.*` metinleri.

---

## Task 1: `question_targets` şeması + migration

**Files:**
- Modify: `db/schema.ts`

**Interfaces:**
- Produces: tablo `questionTargets` (id serial PK; postId→posts cascade; userId→users cascade; source text 'asker'|'admin'; createdAt) + unique(postId,userId) + index(userId). Tip `QuestionTarget`.

- [ ] **Step 1: Tabloyu ekle**

`db/schema.ts` içinde `userRoles` tanımından SONRA, relations bloğundan ÖNCE ekle:
```ts
// Bir sorunun (posts.type='question') hedeflendiği kullanıcı(lar).
// source: 'asker' (soran belirli kişiye sordu) | 'admin' (kurucu elle yönlendirdi).
// Herkese açık sorularda hiç satır olmaz.
export const questionTargets = pgTable(
  "question_targets",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    source: text("source").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    unique("question_targets_unique").on(t.postId, t.userId),
    index("question_targets_user_idx").on(t.userId),
  ],
);
```

- [ ] **Step 2: Tipi ekle**

`db/schema.ts` en altındaki export tipleri yanına:
```ts
export type QuestionTarget = typeof questionTargets.$inferSelect;
```

- [ ] **Step 3: Migration üret**

Run: `npm run db:generate`
Expected: yeni `00XX_*.sql` içinde `CREATE TABLE "question_targets"` + `UNIQUE("post_id","user_id")` + index.

- [ ] **Step 4: Tip + commit (DB uygulaması Task 5 sonunda toplu)**

Run: `npm run typecheck`
Expected: PASS.
```bash
git add db/schema.ts db/migrations/
git commit -m "feat(questions): add question_targets table"
```

---

## Task 2: Hedef bildirimi (bot + notifications)

**Files:**
- Modify: `lib/telegram/i18n.ts`
- Modify: `lib/telegram/notifications.ts`

**Interfaces:**
- Produces: `BotStrings.notifyQuestion: (label: string) => string`; `async function notifyQuestionTarget(targetUserId: string, postId: number, title: string | null)`.

- [ ] **Step 1: `BotStrings` arayüzüne ekle**

`lib/telegram/i18n.ts` `interface BotStrings` içine, `notifyFollow` satırından sonra:
```ts
  notifyQuestion: (label: string) => string;
```

- [ ] **Step 2: Her dile metni ekle**

Her dilin `STRINGS` bloğunda `notifyFollow` satırından sonra ekle:
- uz: `    notifyQuestion: (label) => `❓ Sizga savol yo'naltirildi: ${label}`,`
- en: `    notifyQuestion: (label) => `❓ A question was directed to you: ${label}`,`
- ru: `    notifyQuestion: (label) => `❓ Вам направлен вопрос: ${label}`,`
- tr: `    notifyQuestion: (label) => `❓ Sana bir soru yöneltildi: ${label}`,`

- [ ] **Step 3: `notifyQuestionTarget`'i ekle**

`lib/telegram/notifications.ts` sonuna ekle:
```ts
// Soru hedeflenen kullanıcıya bildirim (soran "belirli kişiye" sordu ya da admin yönlendirdi).
export async function notifyQuestionTarget(
  targetUserId: string,
  postId: number,
  title: string | null,
) {
  const to = await recipient(targetUserId);
  if (!to) return;
  const s = botStrings(to.languageCode);
  const locale = pickLocale(to.languageCode);
  const label = title ? `"${title}"` : s.postLabelFallback;
  await notifyUser(
    to.telegramId,
    `${s.notifyQuestion(label)}\n${appLink(locale, `feed/${postId}`)}`,
  );
}
```

- [ ] **Step 4: Doğrula + commit**

Run: `npm run typecheck`
Expected: PASS.
```bash
git add lib/telegram/i18n.ts lib/telegram/notifications.ts
git commit -m "feat(questions): notifyQuestionTarget bot notification (4 locales)"
```

---

## Task 3: `createPost`'a "belirli kişiye" hedefleme

**Files:**
- Modify: `lib/actions/posts.ts`

**Interfaces:**
- Consumes: `questionTargets`, `notifyQuestionTarget`.
- Değişiklik: `createSchema`'ya `targetUserId` (opsiyonel string) eklenir. Soru + `targetUserId` verilince hedef satırı açılır (source='asker') ve hedefe bildirim gider. Kendine hedefleme yok sayılır.

- [ ] **Step 1: Importları ekle**

`lib/actions/posts.ts` üstüne:
```ts
import { notifyQuestionTarget } from "@/lib/telegram/notifications";
```
ve `posts, comments, reactions, topics` import satırına `questionTargets` ekle:
```ts
import { posts, comments, reactions, topics, questionTargets } from "@/db/schema";
```

- [ ] **Step 2: Şemaya alanı ekle**

`createSchema`'ya `topicSlug` satırından sonra:
```ts
  targetUserId: z.string().trim().optional().or(z.literal("")),
```

- [ ] **Step 3: Insert sonrası hedefi işle**

`createPost` içinde, `return { ok: true, id: created.id };` satırından ÖNCE ekle:
```ts
  // "Belirli kişiye" sorulan soru: hedef satırı + bildirim (kendine hariç).
  if (data.type === "question" && data.targetUserId && data.targetUserId !== userId) {
    await db
      .insert(questionTargets)
      .values({ postId: created.id, userId: data.targetUserId, source: "asker" })
      .onConflictDoNothing();
    void notifyQuestionTarget(data.targetUserId, created.id, data.title || null);
  }
```

- [ ] **Step 4: Doğrula + commit**

Run: `npm run typecheck && npm run lint`
Expected: PASS.
```bash
git add lib/actions/posts.ts
git commit -m "feat(questions): createPost targets a specific user (asker door)"
```

---

## Task 4: Compose'da kapı seçici

**Files:**
- Modify: `components/feed/NewPostForm.tsx`
- Modify: `app/[locale]/feed/new/page.tsx`
- Modify: `messages/{uz,en,ru,tr}.json`

**Interfaces:**
- Consumes: `listProfilesForPicker()` (mevcut, `{ userId, name }[]`).
- Değişiklik: NewPostForm `people?: { userId: string; name: string | null }[]` prop alır; tip 'question' VE oluşturma modunda (düzenleme değil) kapı seçici gösterir: herkese açık (varsayılan) / belirli kişiye (+ kişi seçimi). Seçilen hedef `createPost`'a `targetUserId` olarak gider.

- [ ] **Step 1: i18n metinleri**

Her `messages/*.json` `feed` nesnesine `audience` ekle (anahtar adları aynı; çeviriler):
- uz: `"audience": { "label": "Kimga", "public": "Hammaga ochiq", "direct": "Muayyan shaxsga", "pickPerson": "Kishini tanlang" }`
- en: `"audience": { "label": "Audience", "public": "Everyone", "direct": "A specific person", "pickPerson": "Pick a person" }`
- ru: `"audience": { "label": "Кому", "public": "Всем", "direct": "Конкретному человеку", "pickPerson": "Выберите человека" }`
- tr: `"audience": { "label": "Kime", "public": "Herkese açık", "direct": "Belirli kişiye", "pickPerson": "Kişi seç" }`

(`feed` nesnesi içinde mevcut bir anahtarın yanına ekle; JSON virgüllerine dikkat.)

- [ ] **Step 2: Forma kapı seçiciyi ekle**

`components/feed/NewPostForm.tsx`:
- `Props`'a ekle: `people?: { userId: string; name: string | null }[];`
- imza: `export function NewPostForm({ topics, initial, people = [] }: Props) {`
- state ekle (mevcut `useState` satırlarının yanına):
```tsx
  const [audience, setAudience] = useState<"public" | "direct">("public");
  const [targetUserId, setTargetUserId] = useState("");
```
- `createPost` çağrısını güncelle (yalnız oluşturma dalı):
```tsx
    const res = initial
      ? await updatePost({ id: initial.id, type, topicSlug, title, body })
      : await createPost({
          type,
          topicSlug,
          title,
          body,
          targetUserId:
            type === "question" && audience === "direct" ? targetUserId : "",
        });
```
- Tip seçici `<div>`'inden sonra, `topic` label'ından ÖNCE kapı seçiciyi ekle:
```tsx
        {!editing && type === "question" && (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">{t("audience.label")}</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAudience("public")}
                className="cursor-pointer"
                aria-pressed={audience === "public"}
              >
                <Chip active={audience === "public"}>{t("audience.public")}</Chip>
              </button>
              <button
                type="button"
                onClick={() => setAudience("direct")}
                className="cursor-pointer"
                aria-pressed={audience === "direct"}
              >
                <Chip active={audience === "direct"}>{t("audience.direct")}</Chip>
              </button>
            </div>
            {audience === "direct" && (
              <select
                className={fieldClass}
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
              >
                <option value="">{t("audience.pickPerson")}</option>
                {people.map((p) => (
                  <option key={p.userId} value={p.userId}>
                    {p.name || p.userId.slice(0, 8)}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
```
- Gönder düğmesi `disabled` koşulunu güncelle (belirli kişiye seçildiyse hedef şart):
```tsx
        disabled={
          saving ||
          !body.trim() ||
          (!editing && type === "question" && audience === "direct" && !targetUserId)
        }
```

- [ ] **Step 3: feed/new sayfasında profilleri yükle**

`app/[locale]/feed/new/page.tsx`:
- import: `import { listProfilesForPicker } from "@/lib/queries/spotlight";`
- `topics` hesaplamasından sonra: `const people = await listProfilesForPicker();`
- render: `<NewPostForm topics={topics} people={people} />`

- [ ] **Step 4: Doğrula + commit**

Run: `npm run typecheck && npm run lint && npm run build`
Expected: PASS.
Manuel: `npm run dev` → `/<locale>/feed/new` → tip "Soru" seç → "Kime" çıkar; "Belirli kişiye" seçince kişi listesi açılır; soru gönderince hedef kişiye Telegram bildirimi (kayıtlı telegramId varsa) düşer ve `feed/<id>`'e yönlenir.
```bash
git add components/feed/NewPostForm.tsx "app/[locale]/feed/new/page.tsx" messages/
git commit -m "feat(questions): audience selector (public / specific person) on compose"
```

---

## Task 5: Admin elle yönlendirme

**Files:**
- Create: `lib/queries/questions.ts`
- Create: `lib/actions/questions.ts`
- Create: `components/admin/RouteQuestionAdmin.tsx`
- Modify: `app/[locale]/admin/page.tsx`
- Modify: `messages/{uz,en,ru,tr}.json`

**Interfaces:**
- Produces:
  - `listOpenQuestions(): Promise<{ id: number; title: string | null; body: string; authorName: string | null }[]>`
  - `routeQuestion(input: { postId: number; userId: string }): Promise<{ ok: true } | { ok: false; error: string }>` (yalnız `content.moderate` yetkisi)
  - `<RouteQuestionAdmin questions={...} people={...} />`

- [ ] **Step 1: Açık soruları sorgula**

Create `lib/queries/questions.ts`:
```ts
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { posts, profiles } from "@/db/schema";

// En yeni sorular (admin yönlendirme paneli için). Faz 1: basit son-N listesi.
export async function listOpenQuestions(): Promise<
  { id: number; title: string | null; body: string; authorName: string | null }[]
> {
  return db
    .select({
      id: posts.id,
      title: posts.title,
      body: posts.body,
      authorName: profiles.displayName,
    })
    .from(posts)
    .leftJoin(profiles, eq(profiles.userId, posts.authorId))
    .where(eq(posts.type, "question"))
    .orderBy(desc(posts.createdAt))
    .limit(50);
}
```

- [ ] **Step 2: `routeQuestion` action'ı**

Create `lib/actions/questions.ts`:
```ts
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
```

- [ ] **Step 3: Admin bileşeni**

Create `components/admin/RouteQuestionAdmin.tsx`:
```tsx
"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { routeQuestion } from "@/lib/actions/questions";
import { Card, SectionHeader, buttonClass, fieldClass } from "@/components/ui/kit";

type QuestionOption = {
  id: number;
  title: string | null;
  body: string;
  authorName: string | null;
};
type PersonOption = { userId: string; name: string | null };

export function RouteQuestionAdmin({
  questions,
  people,
}: {
  questions: QuestionOption[];
  people: PersonOption[];
}) {
  const t = useTranslations("admin.route");
  const [postId, setPostId] = useState("");
  const [userId, setUserId] = useState("");
  const [pending, startTransition] = useTransition();

  function onRoute() {
    if (!postId || !userId) return;
    startTransition(async () => {
      await routeQuestion({ postId: Number(postId), userId });
      setPostId("");
      setUserId("");
    });
  }

  return (
    <Card className="p-4">
      <SectionHeader>{t("title")}</SectionHeader>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          {t("pickQuestion")}
          <select
            className={fieldClass}
            value={postId}
            onChange={(e) => setPostId(e.target.value)}
          >
            <option value="">—</option>
            {questions.map((q) => (
              <option key={q.id} value={q.id}>
                {(q.title || q.body).slice(0, 60)}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          {t("pickPerson")}
          <select
            className={fieldClass}
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          >
            <option value="">—</option>
            {people.map((p) => (
              <option key={p.userId} value={p.userId}>
                {p.name || p.userId.slice(0, 8)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button
        className={buttonClass("primary", "mt-3")}
        disabled={pending || !postId || !userId}
        onClick={onRoute}
      >
        {t("route")}
      </button>
    </Card>
  );
}
```

- [ ] **Step 4: i18n metinleri**

Her `messages/*.json` `admin` nesnesine `route` ekle (`roles`'un yanına):
- uz: `"route": { "title": "Savolni yo'naltirish", "pickQuestion": "Savol", "pickPerson": "Kishi", "route": "Yo'naltirish" }`
- en: `"route": { "title": "Route a question", "pickQuestion": "Question", "pickPerson": "Person", "route": "Route" }`
- ru: `"route": { "title": "Направить вопрос", "pickQuestion": "Вопрос", "pickPerson": "Человек", "route": "Направить" }`
- tr: `"route": { "title": "Soru yönlendir", "pickQuestion": "Soru", "pickPerson": "Kişi", "route": "Yönlendir" }`

- [ ] **Step 5: Admin sayfasına mount et**

`app/[locale]/admin/page.tsx`:
- import: `import { listOpenQuestions } from "@/lib/queries/questions";` ve `import { RouteQuestionAdmin } from "@/components/admin/RouteQuestionAdmin";`
- `Promise.all` listesine `listOpenQuestions()` ekle, sonucu `openQuestions` olarak al.
- RolesAdmin'den sonra mount et:
```tsx
        <SectionHeader>{t("route.title")}</SectionHeader>
        <RouteQuestionAdmin questions={openQuestions} people={pickerProfiles} />
```

- [ ] **Step 6: Doğrula + DB uygula + commit**

Run: `npm run typecheck && npm run lint && npm run build`
Expected: PASS.
DB (Task 1 migration'ı dahil uygula):
```bash
npm run db:migrate
```
Expected: `question_targets` tablosu oluşur.
Manuel: admin panelde "Soru yönlendir" kartından bir soru + kişi seç → "Yönlendir" → hedefe bildirim.
```bash
git add lib/queries/questions.ts lib/actions/questions.ts components/admin/RouteQuestionAdmin.tsx "app/[locale]/admin/page.tsx" messages/
git commit -m "feat(questions): admin manual question routing + i18n"
```

---

## Self-Review

- **Spec §6.5 Faz 1 kapı kapsamı:** herkese açık (varsayılan, mevcut) + belirli kişiye (Task 3-4) + admin elle yönlendirme (Task 5). Etikete-hedefli + Üstlen/Pas **bilinçli** Faz 2.
- **Placeholder yok:** tüm kod tam; i18n metinleri 4 dilde verildi.
- **Tip tutarlılığı:** `notifyQuestionTarget(targetUserId, postId, title)` Task 2'de tanımlı, Task 3 ve Task 5'te aynı imzayla çağrılıyor. `question_targets` sütunları Task 1 ↔ insert'ler tutarlı (postId, userId, source).
- **Cevaplama:** mevcut yorum akışı yeterli — yeni şey yok (YAGNI). "Sana yöneltilen sorular" gelen kutusu Faz 2.
- **DB uygulaması:** migration Task 1'de üretilir, Task 5 sonunda topluca uygulanır (tek migrate).

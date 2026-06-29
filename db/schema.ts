import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  bigint,
  jsonb,
  primaryKey,
  uniqueIndex,
  unique,
  index,
  serial,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Auth.js (NextAuth) uyumlu çekirdek tablolar + Telegram alanları
// ---------------------------------------------------------------------------

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  // E-posta/şifre girişi için (bcrypt). OAuth/Telegram kullanıcılarında null.
  passwordHash: text("password_hash"),
  // Telegram kimliği (Mini App'ten gelir) — birincil bağlama anahtarı
  telegramId: bigint("telegram_id", { mode: "number" }).unique(),
  telegramUsername: text("telegram_username"),
  languageCode: text("language_code"),
  photoUrl: text("photo_url"),
  // Bu kullanıcıyı davet eden kullanıcı (referans). Yalnızca ilk kayıtta set edilir.
  referredBy: text("referred_by").references((): AnyPgColumn => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

// Davet (referans) talebi: bir kullanıcı bir Telegram id'sini davet ettiğinde,
// o id Mini App'e girip hesap açana kadar burada "bekleyen" olarak tutulur.
// Hesap oluşunca upsertTelegramUser bunu tüketip users.referredBy'a yazar.
export const referralClaims = pgTable("referral_claims", {
  telegramId: bigint("telegram_id", { mode: "number" }).primaryKey(),
  referrerUserId: text("referrer_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);

// ---------------------------------------------------------------------------
// Uygulama tabloları
// ---------------------------------------------------------------------------

export const profiles = pgTable("profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  // Hiçbir alan zorunlu değil — kullanıcı anonim/takma adlı kalabilir.
  displayName: text("display_name"),
  headline: text("headline"),
  bio: text("bio"),
  // Kullanıcı durumu: 'student' | 'working' | 'seeking' | 'enthusiast' | 'other'
  status: text("status"),
  // Ülke ISO alpha-2 kodu (ör. "TR"); isim dile göre Intl.DisplayNames ile gösterilir.
  country: text("country"),
  city: text("city"),
  currentRole: text("current_role"),
  company: text("company"),
  educationLevel: text("education_level"),
  // Taksonomi dışı, kullanıcının kendi eklediği serbest alanlar
  customFields: jsonb("custom_fields").$type<string[]>().default([]),
  openToMentoring: boolean("open_to_mentoring").notNull().default(false),
  lookingForCollaborators: boolean("looking_for_collaborators")
    .notNull()
    .default(false),
  // { linkedin, github, telegram, website }
  links: jsonb("links").$type<Record<string, string>>().default({}),
  contentLang: text("content_lang"),
  onboardedAt: timestamp("onboarded_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

// Mühendislik alanları taksonomisi (seed ile doldurulur)
export const engineeringFields = pgTable("engineering_fields", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  // Çok dilli etiketler: { uz, en, ru, tr }
  labels: jsonb("labels").$type<Record<string, string>>().notNull(),
});

export const profileFields = pgTable(
  "profile_fields",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    fieldId: integer("field_id")
      .notNull()
      .references(() => engineeringFields.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.fieldId] })],
);

export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const profileSkills = pgTable(
  "profile_skills",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    skillId: integer("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.skillId] })],
);

export const interests = pgTable("interests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const profileInterests = pgTable(
  "profile_interests",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    interestId: integer("interest_id")
      .notNull()
      .references(() => interests.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.interestId] })],
);

export const topics = pgTable("topics", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  labels: jsonb("labels").$type<Record<string, string>>().notNull(),
});

// Gönderi türleri: 'post' | 'question' | 'project'
export const posts = pgTable(
  "posts",
  {
    id: serial("id").primaryKey(),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull().default("post"),
    title: text("title"),
    body: text("body").notNull(),
    topicId: integer("topic_id").references(() => topics.id, {
      onDelete: "set null",
    }),
    contentLang: text("content_lang"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("posts_created_idx").on(t.createdAt)],
);

export const comments = pgTable(
  "comments",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("comments_post_idx").on(t.postId)],
);

// Takip / yer imi: bir kullanıcı başka bir kullanıcıyı takip eder.
export const follows = pgTable(
  "follows",
  {
    followerId: text("follower_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    followingId: text("following_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.followerId, t.followingId] }),
    index("follows_following_idx").on(t.followingId),
  ],
);

export const reactions = pgTable(
  "reactions",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.postId] }),
    uniqueIndex("reactions_unique_idx").on(t.userId, t.postId),
  ],
);

// Şikayet / raporlama: bir kullanıcı bir gönderi ya da yorumu bildirir.
// Adminler bot DM ile haberdar edilir; içeriği gönderi sayfasından silebilir.
export const reports = pgTable(
  "reports",
  {
    id: serial("id").primaryKey(),
    reporterId: text("reporter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    postId: integer("post_id").references(() => posts.id, {
      onDelete: "cascade",
    }),
    commentId: integer("comment_id").references(() => comments.id, {
      onDelete: "cascade",
    }),
    reason: text("reason"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("reports_created_idx").on(t.createdAt)],
);

// "Haftaning muhandisi" — küratörlü öne çıkan mühendis. Admin seçer; en yeni
// kayıt landing'de gösterilir. Telegram'da yapılamayan, app'e özel içerik döngüsü.
export const spotlights = pgTable(
  "spotlights",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // En çarpıcı alıntı (röportajdan) ve 1-2 cümlelik tanıtım — ikisi de opsiyonel.
    quote: text("quote"),
    blurb: text("blurb"),
    publishedAt: timestamp("published_at", { mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("spotlights_published_idx").on(t.publishedAt)],
);

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
    unique("user_roles_unique")
      .on(t.userId, t.roleSlug, t.topicId)
      .nullsNotDistinct(),
    index("user_roles_user_idx").on(t.userId),
  ],
);

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

// ---------------------------------------------------------------------------
// İlişkiler (Drizzle relational queries için)
// ---------------------------------------------------------------------------

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  fields: many(profileFields),
  skills: many(profileSkills),
  interests: many(profileInterests),
  posts: many(posts),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, { fields: [profiles.userId], references: [users.id] }),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
  topic: one(topics, { fields: [posts.topicId], references: [topics.id] }),
  comments: many(comments),
  reactions: many(reactions),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
  author: one(users, { fields: [comments.authorId], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Spotlight = typeof spotlights.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type UserRole = typeof userRoles.$inferSelect;
export type QuestionTarget = typeof questionTargets.$inferSelect;

"use server";

import { z } from "zod";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  profiles,
  engineeringFields,
  profileFields,
  skills,
  profileSkills,
  interests,
  profileInterests,
} from "@/db/schema";
import { requireUserId } from "@/lib/auth/session";
import { EDUCATION_LEVELS } from "@/lib/data/taxonomy";

const linkSchema = z.string().trim().max(300).optional().or(z.literal(""));

const profileSchema = z.object({
  displayName: z.string().trim().min(1, "İsim gerekli").max(120),
  headline: z.string().trim().max(160).optional().or(z.literal("")),
  bio: z.string().trim().max(2000).optional().or(z.literal("")),
  country: z.string().trim().max(80).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  currentRole: z.string().trim().max(120).optional().or(z.literal("")),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  educationLevel: z.enum(EDUCATION_LEVELS).optional(),
  openToMentoring: z.boolean().default(false),
  lookingForCollaborators: z.boolean().default(false),
  fieldSlugs: z.array(z.string()).max(8).default([]),
  skills: z.array(z.string().trim().min(1).max(40)).max(30).default([]),
  interests: z.array(z.string().trim().min(1).max(40)).max(30).default([]),
  links: z
    .object({
      linkedin: linkSchema,
      github: linkSchema,
      website: linkSchema,
      telegram: linkSchema,
    })
    .partial()
    .default({}),
});

export type ProfileInput = z.input<typeof profileSchema>;

export type SaveProfileResult =
  | { ok: true }
  | { ok: false; error: string };

// Verilen isimler için tag satırlarını garanti eder ve id'lerini döner.
async function ensureTagIds(
  table: typeof skills | typeof interests,
  names: string[],
): Promise<number[]> {
  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  if (unique.length === 0) return [];
  // skills ve interests yapısal olarak aynı; union method tiplemesini sadeleştir.
  const tbl = table as typeof skills;
  await db
    .insert(tbl)
    .values(unique.map((name) => ({ name })))
    .onConflictDoNothing({ target: tbl.name });
  const rows = await db
    .select({ id: tbl.id, name: tbl.name })
    .from(tbl)
    .where(inArray(tbl.name, unique));
  return rows.map((r) => r.id);
}

export async function saveProfile(
  input: ProfileInput,
): Promise<SaveProfileResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "UNAUTHENTICATED" };
  }

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "INVALID" };
  }
  const data = parsed.data;

  // Boş link alanlarını temizle
  const links = Object.fromEntries(
    Object.entries(data.links ?? {}).filter(([, v]) => v && v.length > 0),
  ) as Record<string, string>;

  const existing = await db.query.profiles.findFirst({
    where: eq(profiles.userId, userId),
  });

  const now = new Date();
  const baseValues = {
    displayName: data.displayName,
    headline: data.headline || null,
    bio: data.bio || null,
    country: data.country || null,
    city: data.city || null,
    currentRole: data.currentRole || null,
    company: data.company || null,
    educationLevel: data.educationLevel || null,
    openToMentoring: data.openToMentoring,
    lookingForCollaborators: data.lookingForCollaborators,
    links,
    updatedAt: now,
  };

  if (existing) {
    await db
      .update(profiles)
      .set(baseValues)
      .where(eq(profiles.userId, userId));
  } else {
    await db.insert(profiles).values({
      userId,
      ...baseValues,
      onboardedAt: now,
    });
  }

  // Mühendislik alanları (slug -> id)
  await db.delete(profileFields).where(eq(profileFields.userId, userId));
  if (data.fieldSlugs.length > 0) {
    const fieldRows = await db
      .select({ id: engineeringFields.id, slug: engineeringFields.slug })
      .from(engineeringFields)
      .where(inArray(engineeringFields.slug, data.fieldSlugs));
    if (fieldRows.length > 0) {
      await db
        .insert(profileFields)
        .values(fieldRows.map((f) => ({ userId, fieldId: f.id })))
        .onConflictDoNothing();
    }
  }

  // Yetenekler
  await db.delete(profileSkills).where(eq(profileSkills.userId, userId));
  const skillIds = await ensureTagIds(skills, data.skills);
  if (skillIds.length > 0) {
    await db
      .insert(profileSkills)
      .values(skillIds.map((id) => ({ userId, skillId: id })))
      .onConflictDoNothing();
  }

  // İlgi alanları
  await db.delete(profileInterests).where(eq(profileInterests.userId, userId));
  const interestIds = await ensureTagIds(interests, data.interests);
  if (interestIds.length > 0) {
    await db
      .insert(profileInterests)
      .values(interestIds.map((id) => ({ userId, interestId: id })))
      .onConflictDoNothing();
  }

  return { ok: true };
}

// Düzenleme formu için kullanıcının mevcut profilini ve seçimlerini yükler.
export async function loadMyProfile() {
  const userId = await requireUserId();

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, userId),
  });

  const fieldRows = await db
    .select({ slug: engineeringFields.slug })
    .from(profileFields)
    .innerJoin(
      engineeringFields,
      eq(profileFields.fieldId, engineeringFields.id),
    )
    .where(eq(profileFields.userId, userId));

  const skillRows = await db
    .select({ name: skills.name })
    .from(profileSkills)
    .innerJoin(skills, eq(profileSkills.skillId, skills.id))
    .where(eq(profileSkills.userId, userId));

  const interestRows = await db
    .select({ name: interests.name })
    .from(profileInterests)
    .innerJoin(interests, eq(profileInterests.interestId, interests.id))
    .where(eq(profileInterests.userId, userId));

  return {
    profile: profile ?? null,
    fieldSlugs: fieldRows.map((r) => r.slug),
    skills: skillRows.map((r) => r.name),
    interests: interestRows.map((r) => r.name),
  };
}

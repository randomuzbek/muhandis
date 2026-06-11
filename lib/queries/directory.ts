import "server-only";
import { and, or, eq, ilike, desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  profiles,
  users,
  engineeringFields,
  profileFields,
  skills,
  profileSkills,
  interests,
  profileInterests,
} from "@/db/schema";

export interface DirectoryFilters {
  q?: string;
  field?: string; // engineering field slug
  country?: string;
  mentoring?: boolean;
  collaborators?: boolean;
}

export interface DirectoryCard {
  userId: string;
  displayName: string | null;
  headline: string | null;
  country: string | null;
  city: string | null;
  currentRole: string | null;
  company: string | null;
  image: string | null;
  openToMentoring: boolean;
  lookingForCollaborators: boolean;
  fieldSlugs: string[];
}

export async function searchProfiles(
  filters: DirectoryFilters,
  limit = 60,
): Promise<DirectoryCard[]> {
  const conditions = [];

  if (filters.q) {
    const like = `%${filters.q}%`;
    // Serbest metin profil alanlarının yanında yetenek/ilgi etiketlerini de tarar.
    const skillSub = db
      .select({ uid: profileSkills.userId })
      .from(profileSkills)
      .innerJoin(skills, eq(profileSkills.skillId, skills.id))
      .where(ilike(skills.name, like));
    const interestSub = db
      .select({ uid: profileInterests.userId })
      .from(profileInterests)
      .innerJoin(interests, eq(profileInterests.interestId, interests.id))
      .where(ilike(interests.name, like));
    conditions.push(
      or(
        ilike(profiles.displayName, like),
        ilike(profiles.headline, like),
        ilike(profiles.company, like),
        ilike(profiles.city, like),
        ilike(profiles.currentRole, like),
        inArray(profiles.userId, skillSub),
        inArray(profiles.userId, interestSub),
      ),
    );
  }
  if (filters.country) {
    // Ülke artık ISO kodu (ör. "TR") olarak saklanıyor → tam eşleşme.
    conditions.push(eq(profiles.country, filters.country));
  }
  if (filters.mentoring) {
    conditions.push(eq(profiles.openToMentoring, true));
  }
  if (filters.collaborators) {
    conditions.push(eq(profiles.lookingForCollaborators, true));
  }
  if (filters.field) {
    const sub = db
      .select({ uid: profileFields.userId })
      .from(profileFields)
      .innerJoin(
        engineeringFields,
        eq(profileFields.fieldId, engineeringFields.id),
      )
      .where(eq(engineeringFields.slug, filters.field));
    conditions.push(inArray(profiles.userId, sub));
  }

  const rows = await db
    .select({
      userId: profiles.userId,
      displayName: profiles.displayName,
      headline: profiles.headline,
      country: profiles.country,
      city: profiles.city,
      currentRole: profiles.currentRole,
      company: profiles.company,
      image: users.image,
      openToMentoring: profiles.openToMentoring,
      lookingForCollaborators: profiles.lookingForCollaborators,
    })
    .from(profiles)
    .innerJoin(users, eq(profiles.userId, users.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(profiles.createdAt))
    .limit(limit);

  if (rows.length === 0) return [];

  // Eşleşen kullanıcıların alanlarını toplu çek ve grupla
  const ids = rows.map((r) => r.userId);
  const fieldRows = await db
    .select({ userId: profileFields.userId, slug: engineeringFields.slug })
    .from(profileFields)
    .innerJoin(
      engineeringFields,
      eq(profileFields.fieldId, engineeringFields.id),
    )
    .where(inArray(profileFields.userId, ids));

  const fieldsByUser = new Map<string, string[]>();
  for (const fr of fieldRows) {
    const arr = fieldsByUser.get(fr.userId) ?? [];
    arr.push(fr.slug);
    fieldsByUser.set(fr.userId, arr);
  }

  return rows.map((r) => ({
    ...r,
    fieldSlugs: fieldsByUser.get(r.userId) ?? [],
  }));
}

export async function getPublicProfile(userId: string) {
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, userId),
  });
  if (!profile) return null;

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      telegramUsername: true,
      telegramId: true,
      image: true,
      photoUrl: true,
    },
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
    profile,
    image: user?.image ?? user?.photoUrl ?? null,
    fieldSlugs: fieldRows.map((r) => r.slug),
    skills: skillRows.map((r) => r.name),
    interests: interestRows.map((r) => r.name),
    telegram: {
      username: user?.telegramUsername ?? null,
      id: user?.telegramId ?? null,
    },
  };
}

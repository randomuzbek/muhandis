import "server-only";
import { sql, count, eq, isNotNull, desc } from "drizzle-orm";
import { db } from "@/db";
import {
  users,
  profiles,
  posts,
  comments,
  engineeringFields,
  profileFields,
} from "@/db/schema";

export interface AdminStats {
  totalUsers: number;
  totalProfiles: number;
  totalPosts: number;
  totalComments: number;
  mentoringCount: number;
  collaboratorsCount: number;
  byField: { slug: string; count: number }[];
  byCountry: { country: string; count: number }[];
}

async function scalar(query: Promise<{ value: number }[]>): Promise<number> {
  const [row] = await query;
  return Number(row?.value ?? 0);
}

export interface PublicStats {
  totalUsers: number;
  mentoringCount: number;
  collaboratorsCount: number;
  countryCount: number;
  byField: { slug: string; count: number }[];
  byCountry: { country: string; count: number }[];
}

export async function getFieldCounts(): Promise<
  { slug: string; count: number }[]
> {
  const rows = await db
    .select({
      slug: engineeringFields.slug,
      count: sql<number>`count(*)`,
    })
    .from(profileFields)
    .innerJoin(
      engineeringFields,
      eq(profileFields.fieldId, engineeringFields.id),
    )
    .groupBy(engineeringFields.slug)
    .orderBy(desc(sql`count(*)`));
  return rows.map((r) => ({ slug: r.slug, count: Number(r.count) }));
}

// Herkese açık topluluk haritası: kimlik ifşa etmeyen toplam sayılar.
export async function getPublicStats(): Promise<PublicStats> {
  const [totalUsers, mentoringCount, collaboratorsCount, byField, byCountry] =
    await Promise.all([
      scalar(db.select({ value: count() }).from(users)),
      scalar(
        db
          .select({ value: count() })
          .from(profiles)
          .where(eq(profiles.openToMentoring, true)),
      ),
      scalar(
        db
          .select({ value: count() })
          .from(profiles)
          .where(eq(profiles.lookingForCollaborators, true)),
      ),
      getFieldCounts(),
      db
        .select({
          country: profiles.country,
          count: sql<number>`count(*)`,
        })
        .from(profiles)
        .where(isNotNull(profiles.country))
        .groupBy(profiles.country)
        .orderBy(desc(sql`count(*)`))
        .limit(15),
    ]);

  const countries = byCountry
    .filter((r) => r.country)
    .map((r) => ({ country: r.country as string, count: Number(r.count) }));

  return {
    totalUsers,
    mentoringCount,
    collaboratorsCount,
    countryCount: countries.length,
    byField,
    byCountry: countries,
  };
}

export async function getAdminStats(): Promise<AdminStats> {
  const [
    totalUsers,
    totalProfiles,
    totalPosts,
    totalComments,
    mentoringCount,
    collaboratorsCount,
  ] = await Promise.all([
    scalar(db.select({ value: count() }).from(users)),
    scalar(db.select({ value: count() }).from(profiles)),
    scalar(db.select({ value: count() }).from(posts)),
    scalar(db.select({ value: count() }).from(comments)),
    scalar(
      db
        .select({ value: count() })
        .from(profiles)
        .where(eq(profiles.openToMentoring, true)),
    ),
    scalar(
      db
        .select({ value: count() })
        .from(profiles)
        .where(eq(profiles.lookingForCollaborators, true)),
    ),
  ]);

  const byField = await db
    .select({
      slug: engineeringFields.slug,
      count: sql<number>`count(*)`,
    })
    .from(profileFields)
    .innerJoin(
      engineeringFields,
      eq(profileFields.fieldId, engineeringFields.id),
    )
    .groupBy(engineeringFields.slug)
    .orderBy(desc(sql`count(*)`));

  const byCountry = await db
    .select({
      country: profiles.country,
      count: sql<number>`count(*)`,
    })
    .from(profiles)
    .where(isNotNull(profiles.country))
    .groupBy(profiles.country)
    .orderBy(desc(sql`count(*)`))
    .limit(15);

  return {
    totalUsers,
    totalProfiles,
    totalPosts,
    totalComments,
    mentoringCount,
    collaboratorsCount,
    byField: byField.map((r) => ({ slug: r.slug, count: Number(r.count) })),
    byCountry: byCountry
      .filter((r) => r.country)
      .map((r) => ({ country: r.country as string, count: Number(r.count) })),
  };
}

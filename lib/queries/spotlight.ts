import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { spotlights, profiles, users } from "@/db/schema";

export interface CurrentSpotlight {
  id: number;
  userId: string;
  name: string | null;
  headline: string | null;
  currentRole: string | null;
  company: string | null;
  country: string | null;
  city: string | null;
  image: string | null;
  quote: string | null;
  blurb: string | null;
  publishedAt: Date;
}

// Landing'de gösterilen en yeni öne çıkan mühendis (varsa).
export async function getCurrentSpotlight(): Promise<CurrentSpotlight | null> {
  const [row] = await db
    .select({
      id: spotlights.id,
      userId: spotlights.userId,
      name: profiles.displayName,
      headline: profiles.headline,
      currentRole: profiles.currentRole,
      company: profiles.company,
      country: profiles.country,
      city: profiles.city,
      image: users.image,
      quote: spotlights.quote,
      blurb: spotlights.blurb,
      publishedAt: spotlights.publishedAt,
    })
    .from(spotlights)
    .innerJoin(users, eq(spotlights.userId, users.id))
    .leftJoin(profiles, eq(spotlights.userId, profiles.userId))
    .orderBy(desc(spotlights.publishedAt))
    .limit(1);

  return row ?? null;
}

export interface SpotlightRow {
  id: number;
  userId: string;
  name: string | null;
  quote: string | null;
  publishedAt: Date;
}

// Admin paneli için son spotlight kayıtları.
export async function listSpotlights(limit = 10): Promise<SpotlightRow[]> {
  return db
    .select({
      id: spotlights.id,
      userId: spotlights.userId,
      name: profiles.displayName,
      quote: spotlights.quote,
      publishedAt: spotlights.publishedAt,
    })
    .from(spotlights)
    .leftJoin(profiles, eq(spotlights.userId, profiles.userId))
    .orderBy(desc(spotlights.publishedAt))
    .limit(limit);
}

export interface ProfilePickerOption {
  userId: string;
  name: string | null;
}

// Admin seçim kutusu için tüm profiller (en yeni önce).
export async function listProfilesForPicker(): Promise<ProfilePickerOption[]> {
  return db
    .select({ userId: profiles.userId, name: profiles.displayName })
    .from(profiles)
    .orderBy(desc(profiles.createdAt))
    .limit(500);
}

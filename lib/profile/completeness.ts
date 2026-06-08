import type { Profile } from "@/db/schema";

export interface CompletenessInput {
  profile: Profile;
  fieldSlugs: string[];
  skills: string[];
  image?: string | null;
}

// Profil doldurma oranını (0..1) ve eksik adım anahtarlarını hesaplar.
// Hiçbiri zorunlu değil; bu yalnızca motive edici bir ölçüdür.
export function profileCompleteness(input: CompletenessInput): {
  score: number;
  missing: string[];
} {
  const { profile: p, fieldSlugs, skills, image } = input;
  const links = (p.links ?? {}) as Record<string, string>;
  const hasLink = Object.values(links).some((v) => v && v.length > 0);

  const checks: { key: string; done: boolean }[] = [
    { key: "photo", done: !!image },
    { key: "displayName", done: !!p.displayName },
    { key: "headline", done: !!p.headline },
    { key: "status", done: !!p.status },
    { key: "country", done: !!p.country },
    { key: "currentRole", done: !!(p.currentRole || p.company) },
    { key: "fields", done: fieldSlugs.length > 0 },
    { key: "skills", done: skills.length > 0 },
    { key: "bio", done: !!p.bio },
    { key: "links", done: hasLink },
  ];

  const done = checks.filter((c) => c.done).length;
  return {
    score: done / checks.length,
    missing: checks.filter((c) => !c.done).map((c) => c.key),
  };
}

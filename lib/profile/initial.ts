import { ENGINEERING_FIELDS, labelFor } from "@/lib/data/taxonomy";
import type { ProfileFormInitial } from "@/components/profile/ProfileForm";
import type { Profile } from "@/db/schema";

// loadMyProfile sonucu + oturum adından form başlangıç değerlerini üretir.
export function buildProfileInitial(args: {
  profile: Profile | null;
  fieldSlugs: string[];
  skills: string[];
  interests: string[];
  fallbackName?: string | null;
}): ProfileFormInitial {
  const p = args.profile;
  return {
    displayName: p?.displayName ?? args.fallbackName ?? "",
    headline: p?.headline ?? "",
    country: p?.country ?? "",
    city: p?.city ?? "",
    currentRole: p?.currentRole ?? "",
    company: p?.company ?? "",
    educationLevel: p?.educationLevel ?? "",
    bio: p?.bio ?? "",
    openToMentoring: p?.openToMentoring ?? false,
    lookingForCollaborators: p?.lookingForCollaborators ?? false,
    fieldSlugs: args.fieldSlugs,
    skills: args.skills,
    interests: args.interests,
    links: (p?.links as ProfileFormInitial["links"]) ?? {},
  };
}

// Form için yerelleştirilmiş mühendislik alanları listesi.
export function localizedFields(locale: string) {
  return ENGINEERING_FIELDS.map((f) => ({
    slug: f.slug,
    label: labelFor(f.labels, locale),
  }));
}

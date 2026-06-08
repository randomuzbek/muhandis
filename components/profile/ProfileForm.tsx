"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { TagInput } from "@/components/ui/TagInput";
import { CountrySelect, CityField } from "@/components/ui/PlaceFields";
import { saveProfile, type ProfileInput } from "@/lib/actions/profile";
import { EDUCATION_LEVELS, STATUS_OPTIONS } from "@/lib/data/taxonomy";

export interface ProfileFormInitial {
  displayName: string;
  headline: string;
  status: string;
  customFields: string[];
  country: string;
  city: string;
  currentRole: string;
  company: string;
  educationLevel: string;
  bio: string;
  openToMentoring: boolean;
  lookingForCollaborators: boolean;
  fieldSlugs: string[];
  skills: string[];
  interests: string[];
  links: { linkedin?: string; github?: string; website?: string; telegram?: string };
}

interface Props {
  initial: ProfileFormInitial;
  fields: { slug: string; label: string }[];
  /** Çağıran bağlamı belirtir; şu an davranış aynı, ileride ayrışabilir. */
  mode: "onboarding" | "edit";
}

const inputClass =
  "w-full rounded-lg border border-foreground/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/40";

export function ProfileForm({ initial, fields }: Props) {
  const t = useTranslations("profile");
  const locale = useLocale();
  const router = useRouter();

  const [state, setState] = useState<ProfileFormInitial>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof ProfileFormInitial>(
    key: K,
    val: ProfileFormInitial[K],
  ) {
    setState((s) => ({ ...s, [key]: val }));
  }

  function toggleField(slug: string) {
    setState((s) => ({
      ...s,
      fieldSlugs: s.fieldSlugs.includes(slug)
        ? s.fieldSlugs.filter((x) => x !== slug)
        : [...s.fieldSlugs, slug],
    }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const input: ProfileInput = {
      displayName: state.displayName,
      headline: state.headline,
      status: state.status
        ? (state.status as ProfileInput["status"])
        : undefined,
      customFields: state.customFields,
      country: state.country,
      city: state.city,
      currentRole: state.currentRole,
      company: state.company,
      educationLevel: state.educationLevel
        ? (state.educationLevel as ProfileInput["educationLevel"])
        : undefined,
      bio: state.bio,
      openToMentoring: state.openToMentoring,
      lookingForCollaborators: state.lookingForCollaborators,
      fieldSlugs: state.fieldSlugs,
      skills: state.skills,
      interests: state.interests,
      links: state.links,
    };
    const res = await saveProfile(input);
    setSaving(false);
    if (res.ok) {
      router.push("/profile");
      router.refresh();
    } else {
      setError(res.error === "UNAUTHENTICATED" ? t("errorGeneric") : res.error);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Labeled label={t("displayName")}>
        <input
          className={inputClass}
          value={state.displayName}
          onChange={(e) => set("displayName", e.target.value)}
          required
        />
      </Labeled>

      <Labeled label={t("headline")}>
        <input
          className={inputClass}
          value={state.headline}
          onChange={(e) => set("headline", e.target.value)}
        />
      </Labeled>

      <Labeled label={t("statusLabel")}>
        <select
          className={inputClass}
          value={state.status}
          onChange={(e) => set("status", e.target.value)}
        >
          <option value="">{t("education.none")}</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {t(`status.${s}`)}
            </option>
          ))}
        </select>
      </Labeled>

      <div className="grid grid-cols-2 gap-3">
        <Labeled label={t("country")}>
          <CountrySelect
            value={state.country}
            onChange={(v) => set("country", v)}
            locale={locale}
            className={inputClass}
            placeholder={t("country")}
          />
        </Labeled>
        <Labeled label={t("city")}>
          <CityField
            value={state.city}
            onChange={(v) => set("city", v)}
            country={state.country}
            className={inputClass}
            placeholder={t("city")}
          />
        </Labeled>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Labeled label={t("currentRole")}>
          <input
            className={inputClass}
            value={state.currentRole}
            onChange={(e) => set("currentRole", e.target.value)}
          />
        </Labeled>
        <Labeled label={t("company")}>
          <input
            className={inputClass}
            value={state.company}
            onChange={(e) => set("company", e.target.value)}
          />
        </Labeled>
      </div>

      <Labeled label={t("educationLevel")}>
        <select
          className={inputClass}
          value={state.educationLevel}
          onChange={(e) => set("educationLevel", e.target.value)}
        >
          <option value="">{t("education.none")}</option>
          {EDUCATION_LEVELS.map((lvl) => (
            <option key={lvl} value={lvl}>
              {t(`education.${lvl}`)}
            </option>
          ))}
        </select>
      </Labeled>

      <Labeled label={t("fields")}>
        <div className="flex flex-wrap gap-2">
          {fields.map((f) => {
            const active = state.fieldSlugs.includes(f.slug);
            return (
              <button
                type="button"
                key={f.slug}
                onClick={() => toggleField(f.slug)}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  active
                    ? "border-transparent bg-foreground text-background"
                    : "border-foreground/20 hover:bg-foreground/5"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </Labeled>

      <Labeled label={t("customFields")}>
        <TagInput
          value={state.customFields}
          onChange={(v) => set("customFields", v)}
          placeholder={t("customFieldsHint")}
        />
      </Labeled>

      <Labeled label={t("skills")}>
        <TagInput
          value={state.skills}
          onChange={(v) => set("skills", v)}
          placeholder={t("tagHint")}
        />
      </Labeled>

      <Labeled label={t("interests")}>
        <TagInput
          value={state.interests}
          onChange={(v) => set("interests", v)}
          placeholder={t("tagHint")}
        />
      </Labeled>

      <Labeled label={t("bio")}>
        <textarea
          className={`${inputClass} min-h-24 resize-y`}
          value={state.bio}
          onChange={(e) => set("bio", e.target.value)}
        />
      </Labeled>

      <Labeled label={t("links")}>
        <div className="grid gap-2">
          {(["linkedin", "github", "website", "telegram"] as const).map((k) => (
            <input
              key={k}
              className={inputClass}
              placeholder={t(k)}
              value={state.links[k] ?? ""}
              onChange={(e) =>
                set("links", { ...state.links, [k]: e.target.value })
              }
            />
          ))}
        </div>
      </Labeled>

      <div className="flex flex-col gap-2">
        <Check
          label={t("openToMentoring")}
          checked={state.openToMentoring}
          onChange={(v) => set("openToMentoring", v)}
        />
        <Check
          label={t("lookingForCollaborators")}
          checked={state.lookingForCollaborators}
          onChange={(v) => set("lookingForCollaborators", v)}
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={saving || !state.displayName.trim()}
        className="mt-2 rounded-full bg-foreground px-6 py-3 font-medium text-background transition hover:opacity-90 disabled:opacity-50"
      >
        {saving ? t("saving") : t("save")}
      </button>
    </form>
  );
}

function Labeled({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium opacity-80">{label}</span>
      {children}
    </label>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2.5 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4"
      />
      {label}
    </label>
  );
}

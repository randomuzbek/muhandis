"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { TagInput } from "@/components/ui/TagInput";
import { CountrySelect, CityField } from "@/components/ui/PlaceFields";
import type { ProfileFormInitial } from "@/components/profile/ProfileForm";
import { saveProfile, type ProfileInput } from "@/lib/actions/profile";
import { EDUCATION_LEVELS, STATUS_OPTIONS } from "@/lib/data/taxonomy";
import { fieldClass, buttonClass, ProgressBar } from "@/components/ui/kit";

interface Props {
  initial: ProfileFormInitial;
  fields: { slug: string; label: string }[];
  /** Telegram'dan gelen ilk isim — karşılama mesajı için. */
  greetingName: string;
  /** Ülke adlarını yerelleştirmek için. */
  locale: string;
}

const inputClass = fieldClass;

export function OnboardingWizard({
  initial,
  fields,
  greetingName,
  locale,
}: Props) {
  const t = useTranslations("profile");
  const router = useRouter();

  const [state, setState] = useState<ProfileFormInitial>(initial);
  const [step, setStep] = useState(0);
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

  const steps = useMemo(
    () => [
      {
        key: "welcome",
        canAdvance: () => state.displayName.trim().length > 0,
        content: (
          <div className="flex flex-col gap-4">
            <p className="text-lg">
              {t("wizard.greeting", { name: greetingName || t("displayName") })}
            </p>
            <Field label={t("displayName")}>
              <input
                className={inputClass}
                value={state.displayName}
                onChange={(e) => set("displayName", e.target.value)}
                autoFocus
              />
            </Field>
            <Field label={t("headline")}>
              <input
                className={inputClass}
                value={state.headline}
                onChange={(e) => set("headline", e.target.value)}
                placeholder="Software Engineer @ ..."
              />
            </Field>
          </div>
        ),
      },
      {
        key: "status",
        canAdvance: () => true,
        content: (
          <div className="flex flex-col gap-3">
            {STATUS_OPTIONS.map((s) => (
              <ChoiceCard
                key={s}
                label={t(`status.${s}`)}
                selected={state.status === s}
                onClick={() =>
                  set("status", state.status === s ? "" : s)
                }
              />
            ))}
          </div>
        ),
      },
      {
        key: "location",
        canAdvance: () => true,
        content: (
          <div className="flex flex-col gap-4">
            <Field label={t("country")}>
              <CountrySelect
                value={state.country}
                onChange={(v) => set("country", v)}
                locale={locale}
                className={inputClass}
                placeholder={t("country")}
              />
            </Field>
            <Field label={t("city")}>
              <CityField
                value={state.city}
                onChange={(v) => set("city", v)}
                country={state.country}
                className={inputClass}
                placeholder={t("city")}
              />
            </Field>
          </div>
        ),
      },
      {
        key: "work",
        canAdvance: () => true,
        content: (
          <div className="flex flex-col gap-4">
            <Field label={t("currentRole")}>
              <input
                className={inputClass}
                value={state.currentRole}
                onChange={(e) => set("currentRole", e.target.value)}
                autoFocus
              />
            </Field>
            <Field label={t("company")}>
              <input
                className={inputClass}
                value={state.company}
                onChange={(e) => set("company", e.target.value)}
              />
            </Field>
            <Field label={t("educationLevel")}>
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
            </Field>
          </div>
        ),
      },
      {
        key: "fields",
        canAdvance: () => true,
        content: (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-2.5">
              {fields.map((f) => {
                const active = state.fieldSlugs.includes(f.slug);
                return (
                  <button
                    type="button"
                    key={f.slug}
                    onClick={() => toggleField(f.slug)}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
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
            <Field label={t("customFields")}>
              <TagInput
                value={state.customFields}
                onChange={(v) => set("customFields", v)}
                placeholder={t("customFieldsHint")}
              />
            </Field>
          </div>
        ),
      },
      {
        key: "skillsInterests",
        canAdvance: () => true,
        content: (
          <div className="flex flex-col gap-5">
            <Field label={t("skills")}>
              <TagInput
                value={state.skills}
                onChange={(v) => set("skills", v)}
                placeholder={t("tagHint")}
              />
            </Field>
            <Field label={t("interests")}>
              <TagInput
                value={state.interests}
                onChange={(v) => set("interests", v)}
                placeholder={t("tagHint")}
              />
            </Field>
          </div>
        ),
      },
      {
        key: "about",
        canAdvance: () => true,
        content: (
          <div className="flex flex-col gap-4">
            <Field label={t("bio")}>
              <textarea
                className={`${inputClass} min-h-28 resize-y`}
                value={state.bio}
                onChange={(e) => set("bio", e.target.value)}
                autoFocus
              />
            </Field>
            <div className="grid gap-2.5">
              {(["linkedin", "github", "website", "telegram"] as const).map(
                (k) => (
                  <input
                    key={k}
                    className={inputClass}
                    placeholder={t(k)}
                    value={state.links[k] ?? ""}
                    onChange={(e) =>
                      set("links", { ...state.links, [k]: e.target.value })
                    }
                  />
                ),
              )}
            </div>
          </div>
        ),
      },
      {
        key: "help",
        canAdvance: () => true,
        content: (
          <div className="flex flex-col gap-3">
            <ToggleCard
              label={t("openToMentoring")}
              checked={state.openToMentoring}
              onChange={(v) => set("openToMentoring", v)}
            />
            <ToggleCard
              label={t("lookingForCollaborators")}
              checked={state.lookingForCollaborators}
              onChange={(v) => set("lookingForCollaborators", v)}
            />
          </div>
        ),
      },
    ],
    [state, fields, greetingName, locale, t],
  );

  const total = steps.length;
  const current = steps[step];
  const isLast = step === total - 1;
  const canAdvance = current.canAdvance();

  async function finish() {
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

  function next() {
    if (isLast) {
      void finish();
    } else {
      setStep((s) => Math.min(s + 1, total - 1));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* İlerleme çubuğu */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-[var(--color-hint)]">
          <span>{t(`wizard.steps.${current.key}.title`)}</span>
          <span>{t("wizard.progress", { current: step + 1, total })}</span>
        </div>
        <ProgressBar value={(step + 1) / total} />
      </div>

      {/* Kart */}
      <div
        key={current.key}
        className="card-in rounded-[var(--radius-card)] bg-[var(--color-section)] p-6 ring-1 ring-[var(--color-separator)]"
      >
        <h2 className="text-xl font-bold">
          {t(`wizard.steps.${current.key}.title`)}
        </h2>
        <p className="mb-6 mt-1 text-sm text-[var(--color-hint)]">
          {t(`wizard.steps.${current.key}.subtitle`)}
        </p>
        {current.content}
      </div>

      {error && (
        <p className="text-sm text-[var(--color-destructive)]">{error}</p>
      )}

      {/* Navigasyon */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(s - 1, 0))}
          disabled={step === 0}
          className={buttonClass("ghost", "disabled:invisible")}
        >
          {t("wizard.back")}
        </button>
        <button
          type="button"
          onClick={next}
          disabled={!canAdvance || saving}
          className={buttonClass("primary", "px-8")}
        >
          {saving
            ? t("saving")
            : isLast
              ? t("wizard.finish")
              : t("wizard.next")}
        </button>
      </div>
    </div>
  );
}

function Field({
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

function ChoiceCard({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-between rounded-xl border px-4 py-4 text-left text-base transition ${
        selected
          ? "border-transparent bg-foreground text-background"
          : "border-foreground/20 hover:bg-foreground/5"
      }`}
    >
      <span className="font-medium">{label}</span>
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full border ${
          selected ? "border-background" : "border-foreground/30"
        }`}
      >
        {selected ? "✓" : ""}
      </span>
    </button>
  );
}

function ToggleCard({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between rounded-xl border px-4 py-4 text-left text-sm transition ${
        checked
          ? "border-transparent bg-foreground text-background"
          : "border-foreground/20 hover:bg-foreground/5"
      }`}
    >
      <span className="font-medium">{label}</span>
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full border ${
          checked ? "border-background" : "border-foreground/30"
        }`}
      >
        {checked ? "✓" : ""}
      </span>
    </button>
  );
}

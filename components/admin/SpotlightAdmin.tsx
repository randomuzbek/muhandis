"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createSpotlight, deleteSpotlight } from "@/lib/actions/spotlight";
import type {
  ProfilePickerOption,
  SpotlightRow,
} from "@/lib/queries/spotlight";
import {
  Card,
  EmptyState,
  buttonClass,
  fieldClass,
  cn,
} from "@/components/ui/kit";

export function SpotlightAdmin({
  profiles,
  recent,
}: {
  profiles: ProfilePickerOption[];
  recent: SpotlightRow[];
}) {
  const t = useTranslations("admin.spotlight");
  const pt = useTranslations("profile");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const nameFor = (name: string | null, userId: string) =>
    name?.trim() || `${pt("anonymous")} · ${userId.slice(0, 6)}`;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setMsg(null);
    startTransition(async () => {
      const res = await createSpotlight(fd);
      if (res.ok) {
        form.reset();
        setMsg(t("published"));
        router.refresh();
      } else {
        setMsg(t("error"));
      }
    });
  }

  function onDelete(id: number) {
    if (!window.confirm(t("confirmDelete"))) return;
    startTransition(async () => {
      await deleteSpotlight(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-3 p-4">
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs text-[var(--color-hint)]">
              {t("pickEngineer")}
            </span>
            <select name="userId" required className={fieldClass} defaultValue="">
              <option value="" disabled>
                —
              </option>
              {profiles.map((p) => (
                <option key={p.userId} value={p.userId}>
                  {nameFor(p.name, p.userId)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-[var(--color-hint)]">
              {t("blurb")}
            </span>
            <textarea
              name="blurb"
              rows={2}
              maxLength={800}
              placeholder={t("blurbPlaceholder")}
              className={cn(fieldClass, "resize-none")}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-[var(--color-hint)]">
              {t("quote")}
            </span>
            <textarea
              name="quote"
              rows={2}
              maxLength={500}
              placeholder={t("quotePlaceholder")}
              className={cn(fieldClass, "resize-none")}
            />
          </label>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className={buttonClass("primary")}
            >
              {pending ? t("publishing") : t("publish")}
            </button>
            {msg && (
              <span className="text-sm text-[var(--color-hint)]">{msg}</span>
            )}
          </div>
        </form>
      </Card>

      {recent.length === 0 ? (
        <Card>
          <EmptyState title={t("empty")} />
        </Card>
      ) : (
        <Card className="divide-y divide-[var(--color-separator)]">
          {recent.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-3 px-4 py-3 text-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {nameFor(s.name, s.userId)}
                </p>
                <p className="text-xs text-[var(--color-hint)]">
                  {new Date(s.publishedAt).toLocaleDateString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onDelete(s.id)}
                disabled={pending}
                className="shrink-0 text-[var(--color-destructive)] hover:underline"
              >
                {t("delete")}
              </button>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { assignRole, revokeRole } from "@/lib/actions/roles";
import { ROLES } from "@/lib/data/roles";
import {
  Card,
  SectionHeader,
  buttonClass,
  fieldClass,
  Chip,
} from "@/components/ui/kit";

type ProfileOption = { userId: string; name: string | null };
type TopicOption = { id: number; slug: string; labels: Record<string, string> };
type RoleAssignment = {
  id: number;
  userId: string;
  roleSlug: string;
  topicId: number | null;
  displayName: string | null;
};

// Çok dilli etiketten dile uygun metni seçer (eksikse İngilizce ya da ilk değer).
function pick(labels: Record<string, string>, locale: string): string {
  return labels[locale] ?? labels.en ?? Object.values(labels)[0] ?? "";
}

export function RolesAdmin({
  profiles,
  topics,
  assignments,
}: {
  profiles: ProfileOption[];
  topics: TopicOption[];
  assignments: RoleAssignment[];
}) {
  const t = useTranslations("admin.roles");
  const locale = useLocale();
  const [userId, setUserId] = useState("");
  const [roleSlug, setRoleSlug] = useState<string>(ROLES[0]?.slug ?? "");
  const [topicId, setTopicId] = useState<string>("");
  const [pending, startTransition] = useTransition();

  const selectedRole = ROLES.find((r) => r.slug === roleSlug);
  const needsTopic = selectedRole?.scope === "topic";

  function onAssign() {
    if (!userId || !roleSlug) return;
    startTransition(async () => {
      await assignRole({
        userId,
        roleSlug,
        topicId: needsTopic && topicId ? Number(topicId) : null,
      });
      setUserId("");
      setTopicId("");
    });
  }

  return (
    <Card className="p-4">
      <SectionHeader>{t("title")}</SectionHeader>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          {t("pickUser")}
          <select
            className={fieldClass}
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          >
            <option value="">—</option>
            {profiles.map((p) => (
              <option key={p.userId} value={p.userId}>
                {p.name || p.userId.slice(0, 8)}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm">
          {t("pickRole")}
          <select
            className={fieldClass}
            value={roleSlug}
            onChange={(e) => setRoleSlug(e.target.value)}
          >
            {ROLES.map((r) => (
              <option key={r.slug} value={r.slug}>
                {pick(r.labels, locale)}
              </option>
            ))}
          </select>
        </label>

        {needsTopic && (
          <label className="grid gap-1 text-sm sm:col-span-2">
            {t("pickTopic")}
            <select
              className={fieldClass}
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
            >
              <option value="">—</option>
              {topics.map((tp) => (
                <option key={tp.id} value={tp.id}>
                  {pick(tp.labels, locale)}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <button
        className={buttonClass("primary", "mt-3")}
        disabled={pending || !userId || (needsTopic && !topicId)}
        onClick={onAssign}
      >
        {t("assign")}
      </button>

      <div className="mt-5">
        <SectionHeader>{t("current")}</SectionHeader>
        {assignments.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--color-hint)]">{t("empty")}</p>
        ) : (
          <ul className="mt-2 grid gap-2">
            {assignments.map((a) => {
              const def = ROLES.find((r) => r.slug === a.roleSlug);
              return (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="text-sm">
                    {a.displayName || a.userId.slice(0, 8)}{" "}
                    <Chip>{def ? pick(def.labels, locale) : a.roleSlug}</Chip>
                    {a.topicId != null && (
                      <span className="text-[var(--color-hint)]">
                        {" "}
                        · #{a.topicId}
                      </span>
                    )}
                  </span>
                  <button
                    className={buttonClass("ghost")}
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await revokeRole(a.id);
                      })
                    }
                  >
                    {t("remove")}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createPost, updatePost } from "@/lib/actions/posts";
import { POST_TYPES, type PostType } from "@/lib/data/posts";
import { Card, Chip, buttonClass, fieldClass, cn } from "@/components/ui/kit";

interface Props {
  topics: { slug: string; label: string }[];
  // "Belirli kişiye" soru için kişi listesi (oluşturma modunda).
  people?: { userId: string; name: string | null }[];
  // Verilirse düzenleme modu (mevcut gönderiyi günceller).
  initial?: {
    id: number;
    type: PostType;
    topicSlug: string;
    title: string;
    body: string;
  };
}

const MAX_BODY = 8000;

function errorMessage(t: (k: string) => string, code: string): string {
  if (code === "RATE_LIMIT") return t("rateLimit");
  return t("errorGeneric");
}

export function NewPostForm({ topics, people = [], initial }: Props) {
  const t = useTranslations("feed");
  const tErr = useTranslations("actions");
  const router = useRouter();
  const editing = !!initial;
  const [type, setType] = useState<PostType>(initial?.type ?? "post");
  const [topicSlug, setTopicSlug] = useState(initial?.topicSlug ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [audience, setAudience] = useState<"public" | "direct">("public");
  const [targetUserId, setTargetUserId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = initial
      ? await updatePost({ id: initial.id, type, topicSlug, title, body })
      : await createPost({
          type,
          topicSlug,
          title,
          body,
          targetUserId:
            type === "question" && audience === "direct" ? targetUserId : "",
        });
    setSaving(false);
    if (res.ok) {
      router.push(`/feed/${initial ? initial.id : res.id}`);
      router.refresh();
    } else {
      setError(errorMessage(tErr, res.error));
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Card className="flex flex-col gap-5 p-4 sm:p-5">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">{t("typeLabel")}</span>
          <div className="flex flex-wrap gap-2">
            {POST_TYPES.map((pt) => (
              <button
                key={pt}
                type="button"
                onClick={() => setType(pt)}
                className="cursor-pointer"
                aria-pressed={type === pt}
              >
                <Chip active={type === pt}>{t(`type.${pt}`)}</Chip>
              </button>
            ))}
          </div>
        </div>

        {!editing && type === "question" && (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">{t("audience.label")}</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAudience("public")}
                className="cursor-pointer"
                aria-pressed={audience === "public"}
              >
                <Chip active={audience === "public"}>{t("audience.public")}</Chip>
              </button>
              <button
                type="button"
                onClick={() => setAudience("direct")}
                className="cursor-pointer"
                aria-pressed={audience === "direct"}
              >
                <Chip active={audience === "direct"}>{t("audience.direct")}</Chip>
              </button>
            </div>
            {audience === "direct" && (
              <select
                className={fieldClass}
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
              >
                <option value="">{t("audience.pickPerson")}</option>
                {people.map((p) => (
                  <option key={p.userId} value={p.userId}>
                    {p.name || p.userId.slice(0, 8)}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">{t("topic")}</span>
          <select
            className={fieldClass}
            value={topicSlug}
            onChange={(e) => setTopicSlug(e.target.value)}
          >
            <option value="">{t("noTopic")}</option>
            {topics.map((tp) => (
              <option key={tp.slug} value={tp.slug}>
                {tp.label}
              </option>
            ))}
          </select>
        </label>

        <input
          className={fieldClass}
          placeholder={t("titlePlaceholder")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={160}
        />

        <div className="flex flex-col gap-1.5">
          <textarea
            className={cn(fieldClass, "min-h-44 resize-y")}
            placeholder={t("bodyPlaceholder")}
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, MAX_BODY))}
            maxLength={MAX_BODY}
            required
          />
          <span
            className={cn(
              "self-end text-xs",
              body.length > MAX_BODY * 0.9
                ? "text-[var(--color-destructive)]"
                : "text-[var(--color-hint)]",
            )}
          >
            {body.length} / {MAX_BODY}
          </span>
        </div>
      </Card>

      {error && (
        <p className="text-sm text-[var(--color-destructive)]">{error}</p>
      )}

      <button
        type="submit"
        disabled={
          saving ||
          !body.trim() ||
          (!editing &&
            type === "question" &&
            audience === "direct" &&
            !targetUserId)
        }
        className={buttonClass("primary", "self-start")}
      >
        {saving
          ? editing
            ? t("updating")
            : t("publishing")
          : editing
            ? t("update")
            : t("publish")}
      </button>
    </form>
  );
}

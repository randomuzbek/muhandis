"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createPost } from "@/lib/actions/posts";
import { POST_TYPES, type PostType } from "@/lib/data/posts";

interface Props {
  topics: { slug: string; label: string }[];
}

const inputClass =
  "w-full rounded-lg border border-foreground/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/40";

export function NewPostForm({ topics }: Props) {
  const t = useTranslations("feed");
  const router = useRouter();
  const [type, setType] = useState<PostType>("post");
  const [topicSlug, setTopicSlug] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await createPost({ type, topicSlug, title, body });
    setSaving(false);
    if (res.ok) {
      router.push(`/feed/${res.id}`);
      router.refresh();
    } else {
      setError(res.error);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium opacity-80">{t("typeLabel")}</span>
          <select
            className={inputClass}
            value={type}
            onChange={(e) => setType(e.target.value as PostType)}
          >
            {POST_TYPES.map((pt) => (
              <option key={pt} value={pt}>
                {t(`type.${pt}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium opacity-80">{t("topic")}</span>
          <select
            className={inputClass}
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
      </div>

      <input
        className={inputClass}
        placeholder={t("titlePlaceholder")}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className={`${inputClass} min-h-40 resize-y`}
        placeholder={t("bodyPlaceholder")}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        required
      />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={saving || !body.trim()}
        className="self-start rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background disabled:opacity-50"
      >
        {saving ? t("publishing") : t("publish")}
      </button>
    </form>
  );
}

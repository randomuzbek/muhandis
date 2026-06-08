"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { updateComment, deleteComment } from "@/lib/actions/posts";
import { formatRelative } from "@/lib/format/time";
import { Avatar, Card, buttonClass, fieldClass, cn } from "@/components/ui/kit";
import { ActionsMenu, type MenuItem } from "./ActionsMenu";
import { ReportModal } from "./ReportModal";
import type { PostComment } from "@/lib/queries/feed";

export function CommentItem({
  comment,
  locale,
  isOwner,
  isAdmin,
  canReport,
}: {
  comment: PostComment;
  locale: string;
  isOwner: boolean;
  isAdmin: boolean;
  canReport: boolean;
}) {
  const t = useTranslations("actions");
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(comment.body);
  const [saving, setSaving] = useState(false);
  const [reporting, setReporting] = useState(false);

  async function onDelete() {
    if (!confirm(t("confirmDelete"))) return;
    const res = await deleteComment(comment.id);
    if (res.ok) router.refresh();
  }

  async function save() {
    if (!body.trim()) return;
    setSaving(true);
    const res = await updateComment(comment.id, body);
    setSaving(false);
    if (res.ok) {
      setEditing(false);
      router.refresh();
    }
  }

  const items: MenuItem[] = [];
  if (isOwner) items.push({ label: t("edit"), onClick: () => setEditing(true) });
  if (isOwner || isAdmin) {
    items.push({ label: t("delete"), danger: true, onClick: onDelete });
  }
  if (canReport) {
    items.push({ label: t("report"), onClick: () => setReporting(true) });
  }

  return (
    <Card className="p-3.5">
      <div className="flex items-center gap-2.5">
        <Link href={`/u/${comment.authorId}`}>
          <Avatar
            name={comment.authorName}
            src={comment.authorImage}
            seed={comment.authorId}
            size={32}
          />
        </Link>
        <Link
          href={`/u/${comment.authorId}`}
          className="truncate text-sm font-medium hover:underline"
        >
          {comment.authorName}
        </Link>
        <span className="text-xs text-[var(--color-hint)]">
          · {formatRelative(comment.createdAt, locale)}
        </span>
        <div className="ml-auto">
          <ActionsMenu items={items} label={t("menu")} />
        </div>
      </div>

      {editing ? (
        <div className="mt-2 flex flex-col gap-2">
          <textarea
            className={cn(fieldClass, "min-h-20 resize-y")}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={4000}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setEditing(false);
                setBody(comment.body);
              }}
              className={buttonClass("secondary")}
            >
              {t("cancel")}
            </button>
            <button
              onClick={save}
              disabled={saving || !body.trim()}
              className={buttonClass("primary")}
            >
              {saving ? t("sending") : t("save")}
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--color-foreground)]/85">
          {comment.body}
        </p>
      )}

      {reporting && (
        <ReportModal commentId={comment.id} onClose={() => setReporting(false)} />
      )}
    </Card>
  );
}

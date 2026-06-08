"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { deletePost } from "@/lib/actions/posts";
import { ActionsMenu, type MenuItem } from "./ActionsMenu";
import { ReportModal } from "./ReportModal";

// Gönderi başlığındaki düzenle/sil/şikayet menüsü.
export function PostActions({
  postId,
  isOwner,
  isAdmin,
  canReport,
}: {
  postId: number;
  isOwner: boolean;
  isAdmin: boolean;
  canReport: boolean;
}) {
  const t = useTranslations("actions");
  const router = useRouter();
  const [reporting, setReporting] = useState(false);

  async function onDelete() {
    if (!confirm(t("confirmDelete"))) return;
    const res = await deletePost(postId);
    if (res.ok) {
      router.push("/feed");
      router.refresh();
    }
  }

  const items: MenuItem[] = [];
  if (isOwner) {
    items.push({
      label: t("edit"),
      onClick: () => router.push(`/feed/${postId}/edit`),
    });
  }
  if (isOwner || isAdmin) {
    items.push({ label: t("delete"), danger: true, onClick: onDelete });
  }
  if (canReport) {
    items.push({ label: t("report"), onClick: () => setReporting(true) });
  }

  return (
    <>
      <ActionsMenu items={items} label={t("menu")} />
      {reporting && (
        <ReportModal postId={postId} onClose={() => setReporting(false)} />
      )}
    </>
  );
}

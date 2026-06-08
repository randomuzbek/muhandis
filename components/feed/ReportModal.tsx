"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { reportContent } from "@/lib/actions/reports";
import { buttonClass, fieldClass, cn } from "@/components/ui/kit";

// Bir gönderi ya da yorumu şikayet etme diyaloğu.
export function ReportModal({
  postId,
  commentId,
  onClose,
}: {
  postId?: number;
  commentId?: number;
  onClose: () => void;
}) {
  const t = useTranslations("actions");
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSending(true);
    setError(null);
    const res = await reportContent({ postId, commentId, reason });
    setSending(false);
    if (res.ok) {
      setDone(true);
      setTimeout(onClose, 1200);
    } else {
      setError(res.error === "RATE_LIMIT" ? t("rateLimit") : t("errorGeneric"));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <div
        className="card-in w-full max-w-sm rounded-t-2xl bg-[var(--color-section)] p-6 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <p className="py-4 text-center font-medium">{t("reported")} ✓</p>
        ) : (
          <>
            <p className="font-semibold">{t("reportTitle")}</p>
            <p className="mt-1 text-sm text-[var(--color-hint)]">
              {t("reportSubtitle")}
            </p>
            <textarea
              className={cn(fieldClass, "mt-3 min-h-24 resize-y")}
              placeholder={t("reportPlaceholder")}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
            />
            {error && (
              <p className="mt-2 text-sm text-[var(--color-destructive)]">
                {error}
              </p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={onClose} className={buttonClass("secondary")}>
                {t("cancel")}
              </button>
              <button
                onClick={submit}
                disabled={sending}
                className={buttonClass("primary")}
              >
                {sending ? t("sending") : t("send")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

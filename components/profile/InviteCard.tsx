"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import QRCode from "qrcode";
import { Card, buttonClass } from "@/components/ui/kit";

// Kullanıcının kişisel davet linkini gösterir: paylaş / kopyala / QR.
// Davet edilen kişi sayısını da gösterir (büyüme için sosyal kanıt).
export function InviteCard({ link, count }: { link: string; count: number }) {
  const t = useTranslations("invite");
  const [open, setOpen] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function onShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: t("shareTitle"), text: t("shareText"), url: link });
        return;
      } catch {
        /* iptal — panele düş */
      }
    }
    openPanel();
  }

  async function openPanel() {
    setOpen(true);
    if (!qr) {
      try {
        setQr(await QRCode.toDataURL(link, { margin: 1, width: 220 }));
      } catch {
        /* yok say */
      }
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* yok say */
    }
  }

  return (
    <>
      <Card className="mt-4 p-5">
        <div className="flex items-start gap-3">
          <span
            className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-field)] bg-[var(--color-secondary)] text-xl"
            aria-hidden
          >
            🎟️
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold">{t("title")}</h2>
            <p className="mt-0.5 text-sm text-[var(--color-hint)]">
              {t("subtitle")}
            </p>
            {count > 0 && (
              <p className="mt-2 text-sm font-medium text-[var(--color-accent)]">
                {t("count", { count })}
              </p>
            )}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={onShare} className={buttonClass("primary")}>
            {t("invite")}
          </button>
          <button onClick={openPanel} className={buttonClass("secondary")}>
            {t("showQr")}
          </button>
        </div>
      </Card>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="card-in w-full max-w-sm rounded-t-2xl bg-[var(--color-section)] p-6 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-4 text-center font-semibold">{t("title")}</p>
            {qr && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qr}
                alt={t("qr")}
                className="mx-auto rounded-xl bg-white p-2"
                width={220}
                height={220}
              />
            )}
            <button
              onClick={copy}
              className={buttonClass("secondary", "mt-5 w-full")}
            >
              {copied ? t("copied") : t("copyLink")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

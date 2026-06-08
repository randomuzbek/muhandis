"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import QRCode from "qrcode";
import { buttonClass } from "@/components/ui/kit";

export function ShareProfile({ url, name }: { url: string; name: string }) {
  const t = useTranslations("profile");
  const [open, setOpen] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function onShare() {
    // Mobil/Telegram'da yerel paylaşım; yoksa QR/kopya panelini aç.
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: name, url });
        return;
      } catch {
        /* iptal edildi — panele düş */
      }
    }
    setOpen(true);
    if (!qr) {
      try {
        const data = await QRCode.toDataURL(url, { margin: 1, width: 220 });
        setQr(data);
      } catch {
        /* yok say */
      }
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* yok say */
    }
  }

  return (
    <>
      <button onClick={onShare} className={buttonClass("secondary")}>
        {t("share")}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="card-in w-full max-w-sm rounded-t-2xl bg-[var(--color-section)] p-6 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-4 text-center font-semibold">{name}</p>
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

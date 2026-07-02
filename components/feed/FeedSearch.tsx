"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { fieldClass } from "@/components/ui/kit";

// Feed'in serbest metin araması. Konu filtresi zaten URL'de (?topic=) linklerle
// çalıştığından, arama da URL'i (?q=) senkronlar → server yeniden render eder,
// mevcut konu seçimi korunur, sonuç paylaşılabilir kalır.
export function FeedSearch({
  initialQ,
  topic,
}: {
  initialQ: string;
  topic?: string;
}) {
  const t = useTranslations("feed");
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(initialQ);
  const [isPending, startTransition] = useTransition();

  const didMount = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const sp = new URLSearchParams();
      if (topic) sp.set("topic", topic);
      if (q.trim()) sp.set("q", q.trim());
      const qs = sp.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname);
      });
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q, topic, pathname, router]);

  return (
    <input
      value={q}
      onChange={(e) => setQ(e.target.value)}
      placeholder={t("searchPlaceholder")}
      className={fieldClass}
      type="search"
      autoComplete="off"
      aria-busy={isPending}
    />
  );
}

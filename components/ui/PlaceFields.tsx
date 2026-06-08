"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { COUNTRY_CODES } from "@/lib/data/places";
import { citiesForCountry } from "@/lib/actions/places";

// Çoğu kullanıcı Özbekistan ve komşu ülkelerden → bunları listenin başına sabitle.
const PRIORITY = ["UZ", "KZ", "KG", "TJ", "TM", "RU", "TR", "AZ"];

// Ülke seçici: değer ISO alpha-2 kodu; etiketler kullanıcının diline göre.
export function CountrySelect({
  value,
  onChange,
  locale,
  className,
  placeholder,
}: {
  value: string;
  onChange: (iso: string) => void;
  locale: string;
  className?: string;
  placeholder?: string;
}) {
  const { priority, rest } = useMemo(() => {
    let dn: Intl.DisplayNames | null = null;
    try {
      dn = new Intl.DisplayNames([locale], { type: "region" });
    } catch {
      dn = null;
    }
    const label = (code: string) => dn?.of(code) ?? code;
    const priority = PRIORITY.map((code) => ({ code, label: label(code) }));
    const rest = COUNTRY_CODES.filter((c) => !PRIORITY.includes(c))
      .map((code) => ({ code, label: label(code) }))
      .sort((a, b) => a.label.localeCompare(b.label, locale));
    return { priority, rest };
  }, [locale]);

  return (
    <select
      className={className}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder ?? "—"}</option>
      {priority.map((o) => (
        <option key={o.code} value={o.code}>
          {o.label}
        </option>
      ))}
      <option disabled>──────────</option>
      {rest.map((o) => (
        <option key={o.code} value={o.code}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// Şehir alanı: seçilen ülkeye (ISO) göre sunucudan şehirler yüklenir;
// yazdıkça filtrelenen özel açılır liste (datalist Telegram webview'inde
// güvenilir çalışmadığı için). Serbest yazıma da izin verir.
export function CityField({
  value,
  onChange,
  country,
  className,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  country: string;
  className?: string;
  placeholder?: string;
}) {
  const [cities, setCities] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    startTransition(async () => {
      if (!country) {
        if (active) setCities([]);
        return;
      }
      const list = await citiesForCountry(country);
      if (active) setCities(list);
    });
    return () => {
      active = false;
    };
  }, [country]);

  // Dışarı tıklayınca kapat
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const q = value.trim().toLowerCase();
  const matches = useMemo(() => {
    if (cities.length === 0) return [];
    const list = q
      ? cities.filter((c) => c.toLowerCase().includes(q))
      : cities;
    return list.slice(0, 60);
  }, [cities, q]);

  const showList = open && matches.length > 0;

  return (
    <div ref={wrapRef} className="relative">
      <input
        className={className}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {showList && (
        <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-[var(--radius-field)] bg-[var(--color-section)] py-1 shadow-lg ring-1 ring-[var(--color-separator)]">
          {matches.map((c) => (
            <li key={c}>
              <button
                type="button"
                // onMouseDown: input blur'undan önce çalışsın
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(c);
                  setOpen(false);
                }}
                className="block w-full px-4 py-2 text-left text-sm hover:bg-[var(--color-secondary)]"
              >
                {c}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { countryName } from "@/lib/data/places";
import { CountrySelect } from "@/components/ui/PlaceFields";
import { searchProfilesAction } from "@/lib/actions/directory";
import type { DirectoryCard } from "@/lib/queries/directory";
import {
  Avatar,
  Card,
  Chip,
  EmptyState,
  Skeleton,
  cn,
  fieldClass,
} from "@/components/ui/kit";

type FieldOption = { slug: string; label: string };

export function DirectorySearch({
  initialResults,
  locale,
  fieldOptions,
}: {
  initialResults: DirectoryCard[];
  locale: string;
  fieldOptions: FieldOption[];
}) {
  const t = useTranslations("directory");
  const pt = useTranslations("profile");

  const [q, setQ] = useState("");
  const [field, setField] = useState("");
  const [country, setCountry] = useState("");
  const [mentoring, setMentoring] = useState(false);
  const [collaborators, setCollaborators] = useState(false);

  const [results, setResults] = useState<DirectoryCard[]>(initialResults);
  const [isPending, startTransition] = useTransition();

  // İlk render'da gelen sonuçları tekrar sorgulamamak için atla.
  const didMount = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fieldLabel = useCallback(
    (slug: string) => fieldOptions.find((f) => f.slug === slug)?.label,
    [fieldOptions],
  );

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const next = await searchProfilesAction({
          q: q.trim() || undefined,
          field: field || undefined,
          country: country || undefined,
          mentoring: mentoring || undefined,
          collaborators: collaborators || undefined,
        });
        setResults(next);
      });
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q, field, country, mentoring, collaborators]);

  return (
    <div className="space-y-4">
      {/* Sabit üst filtre alanı */}
      <div className="sticky top-0 z-10 -mx-6 space-y-3 bg-[var(--color-background)]/90 px-6 pb-2 pt-1 backdrop-blur">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className={fieldClass}
          type="search"
          autoComplete="off"
        />

        <div className="-mx-6 flex items-center gap-2 overflow-x-auto px-6 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <select
            value={field}
            onChange={(e) => setField(e.target.value)}
            className={cn(
              fieldClass,
              "h-9 w-auto shrink-0 py-0 pr-8 text-sm",
              field && "ring-2 ring-[var(--color-button)]",
            )}
          >
            <option value="">{t("allFields")}</option>
            {fieldOptions.map((f) => (
              <option key={f.slug} value={f.slug}>
                {f.label}
              </option>
            ))}
          </select>

          <CountrySelect
            value={country}
            onChange={setCountry}
            locale={locale}
            placeholder={t("countryPlaceholder")}
            className={cn(
              fieldClass,
              "h-9 w-auto shrink-0 py-0 pr-8 text-sm",
              country && "ring-2 ring-[var(--color-button)]",
            )}
          />

          <button
            type="button"
            onClick={() => setMentoring((v) => !v)}
            aria-pressed={mentoring}
            className="shrink-0"
          >
            <Chip active={mentoring}>{t("mentoring")}</Chip>
          </button>

          <button
            type="button"
            onClick={() => setCollaborators((v) => !v)}
            aria-pressed={collaborators}
            className="shrink-0"
          >
            <Chip active={collaborators}>{t("collaborators")}</Chip>
          </button>
        </div>
      </div>

      {/* Sonuç sayısı */}
      <p className="px-1 text-sm text-[var(--color-hint)]">
        {t("results", { count: results.length })}
      </p>

      {isPending ? (
        <Card className="divide-y divide-[var(--color-separator)]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="h-11 w-11 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
            </div>
          ))}
        </Card>
      ) : results.length === 0 ? (
        <Card>
          <EmptyState icon="🔍" title={t("empty")} />
        </Card>
      ) : (
        <Card className="divide-y divide-[var(--color-separator)]">
          {results.map((r) => {
            const name = r.displayName?.trim() || pt("anonymous");
            const roleCompany = [r.currentRole, r.company]
              .filter(Boolean)
              .join(" · ");
            const place = [r.city, countryName(r.country, locale)]
              .filter(Boolean)
              .join(", ");
            return (
              <Link
                key={r.userId}
                href={`/u/${r.userId}`}
                className="flex min-h-[44px] items-center gap-3 px-4 py-3 transition active:bg-[var(--color-secondary)] hover:bg-[var(--color-secondary)]"
              >
                <Avatar
                  name={r.displayName}
                  src={r.image}
                  seed={r.userId}
                  size={44}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold">{name}</p>
                    {r.openToMentoring && (
                      <span
                        className="h-2 w-2 shrink-0 rounded-full bg-green-500"
                        title={t("mentoring")}
                      />
                    )}
                    {r.lookingForCollaborators && (
                      <span
                        className="h-2 w-2 shrink-0 rounded-full bg-blue-500"
                        title={t("collaborators")}
                      />
                    )}
                  </div>
                  {r.headline && (
                    <p className="truncate text-sm text-[var(--color-hint)]">
                      {r.headline}
                    </p>
                  )}
                  {roleCompany && (
                    <p className="truncate text-sm text-[var(--color-hint)]">
                      {roleCompany}
                    </p>
                  )}
                  {place && (
                    <p className="truncate text-sm text-[var(--color-hint)]">
                      📍 {place}
                    </p>
                  )}
                  {r.fieldSlugs.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {r.fieldSlugs.map((slug) => {
                        const label = fieldLabel(slug);
                        if (!label) return null;
                        return (
                          <Chip key={slug} className="px-2 py-0.5 text-xs">
                            {label}
                          </Chip>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </Card>
      )}
    </div>
  );
}

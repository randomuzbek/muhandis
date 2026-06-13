import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCurrentSpotlight } from "@/lib/queries/spotlight";
import { countryName } from "@/lib/data/places";
import { Avatar, Badge, Card, buttonClass } from "@/components/ui/kit";

// Landing'de "Haftaning muhandisi" kartı. Kayıt yoksa hiçbir şey render etmez.
export async function SpotlightCard({ locale }: { locale: string }) {
  const s = await getCurrentSpotlight();
  if (!s) return null;

  const t = await getTranslations("spotlight");
  const pt = await getTranslations("profile");

  const name = s.name?.trim() || pt("anonymous");
  const roleLine = [s.currentRole, s.company].filter(Boolean).join(" · ");
  const place = [s.city, countryName(s.country, locale)]
    .filter(Boolean)
    .join(", ");

  return (
    <section className="w-full">
      <Card className="overflow-hidden p-6">
        <Badge tone="accent">⭐ {t("label")}</Badge>

        <div className="mt-4 flex items-start gap-4">
          <Avatar name={s.name} src={s.image} seed={s.userId} size={64} />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold">{name}</h2>
            {s.headline && (
              <p className="truncate text-sm text-[var(--color-hint)]">
                {s.headline}
              </p>
            )}
            {roleLine && <p className="mt-0.5 truncate text-sm">{roleLine}</p>}
            {place && (
              <p className="truncate text-sm text-[var(--color-hint)]">
                📍 {place}
              </p>
            )}
          </div>
        </div>

        {s.blurb && <p className="mt-4 text-sm">{s.blurb}</p>}

        {s.quote && (
          <blockquote className="mt-4 border-l-2 border-[var(--color-button)] pl-3 text-sm italic text-[var(--color-hint)]">
            “{s.quote}”
          </blockquote>
        )}

        <div className="mt-5">
          <Link href={`/u/${s.userId}`} className={buttonClass("primary")}>
            {t("viewProfile")}
          </Link>
        </div>
      </Card>
    </section>
  );
}

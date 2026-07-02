import { ImageResponse } from "next/og";

// ---------------------------------------------------------------------------
// Paylaşılan OpenGraph kart renderer'ı. Profil paylaşımı, kanal spotlight'ı,
// paylaşılabilir filtreli dizin linkleri ve davet linkleri Telegram/sosyal
// medyada yapıştırıldığında bu kartlar zengin önizleme olarak görünür.
//
// Tasarım sunum/uygulama ile uyumlu: Telegram-koyu zemin + mavi/aqua vurgu.
// next/og (satori) yalnızca flexbox + CSS alt kümesini destekler — grid YOK.
// Yazı tipi belirtilmiyor; next/og'un gömülü Noto Sans varsayılanı Latin
// (uz/en/tr) için yeterli (Kiril/ru için ad alanları sınırlı kalabilir).
// ---------------------------------------------------------------------------

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const BG = "#0e1621";
const BG_2 = "#17212b";
const ACCENT = "#2aa8f2";
const AQUA = "#3ee0c8";
const INK = "#eaf1ff";
const INK_DIM = "#9fb0d0";
const INK_FAINT = "#6c7da0";
const LINE = "rgba(140,165,220,0.16)";

const BRAND = "Muhandis";
const BRAND_HANDLE = "t.me/muhandisapp_bot";

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "64px 72px",
        background: `radial-gradient(1100px 650px at 82% -8%, rgba(42,168,242,0.22), rgba(0,0,0,0) 60%), radial-gradient(800px 560px at 4% 110%, rgba(62,224,200,0.14), rgba(0,0,0,0) 55%), linear-gradient(135deg, ${BG}, ${BG_2})`,
        color: INK,
        fontFamily: "sans-serif",
        position: "relative",
      }}
    >
      {/* üst aksan çizgisi */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 8,
          background: `linear-gradient(90deg, ${ACCENT}, ${AQUA})`,
        }}
      />
      {children}
    </div>
  );
}

function BrandBadge() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(135deg, ${ACCENT}, #1f7fd0)`,
          fontSize: 32,
        }}
      >
        ⚙️
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -0.5 }}>
        {BRAND}
      </div>
    </div>
  );
}

function Footer() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        marginTop: "auto",
        color: INK_FAINT,
        fontSize: 26,
      }}
    >
      <div style={{ width: 10, height: 10, borderRadius: 99, background: AQUA }} />
      <div>{BRAND_HANDLE}</div>
    </div>
  );
}

function renderOg(node: React.ReactElement) {
  return new ImageResponse(node, { ...OG_SIZE });
}

/** Marka/varsayılan kart — ana sayfa, dizin, istatistik vb. için. */
export function brandCard(opts: { title: string; subtitle: string }) {
  return renderOg(
    <Frame>
      <BrandBadge />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginTop: "auto",
          marginBottom: 28,
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            letterSpacing: -1.5,
            lineHeight: 1.05,
            maxWidth: 920,
          }}
        >
          {opts.title}
        </div>
        <div
          style={{
            fontSize: 34,
            color: INK_DIM,
            marginTop: 22,
            maxWidth: 900,
            lineHeight: 1.35,
          }}
        >
          {opts.subtitle}
        </div>
      </div>
      <Footer />
    </Frame>,
  );
}

/** Kişiye özel profil kartı — /u/[id] paylaşımları için. */
export function profileCard(opts: {
  name: string;
  headline: string | null;
  field: string | null;
  location: string | null;
  initial: string;
}) {
  const meta = [opts.field, opts.location].filter(Boolean) as string[];
  return renderOg(
    <Frame>
      <BrandBadge />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 44,
          marginTop: "auto",
          marginBottom: 24,
        }}
      >
        {/* baş harf avatarı (uzak fotoğraf yerine güvenilir) */}
        <div
          style={{
            width: 200,
            height: 200,
            borderRadius: 40,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `linear-gradient(145deg, ${ACCENT}, ${AQUA})`,
            color: "#06121f",
            fontSize: 104,
            fontWeight: 800,
          }}
        >
          {opts.initial}
        </div>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 760 }}>
          <div
            style={{
              fontSize: 68,
              fontWeight: 800,
              letterSpacing: -1.5,
              lineHeight: 1.05,
            }}
          >
            {opts.name}
          </div>
          {opts.headline ? (
            <div
              style={{
                fontSize: 34,
                color: INK_DIM,
                marginTop: 16,
                lineHeight: 1.3,
              }}
            >
              {opts.headline}
            </div>
          ) : null}
          {meta.length > 0 ? (
            <div style={{ display: "flex", gap: 14, marginTop: 26 }}>
              {meta.map((m) => (
                <div
                  key={m}
                  style={{
                    display: "flex",
                    fontSize: 26,
                    fontWeight: 600,
                    color: INK,
                    background: "rgba(42,168,242,0.14)",
                    border: `1px solid ${LINE}`,
                    borderRadius: 99,
                    padding: "10px 22px",
                  }}
                >
                  {m}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <Footer />
    </Frame>,
  );
}

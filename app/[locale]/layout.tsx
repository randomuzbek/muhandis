import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import Script from "next/script";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Providers } from "@/components/providers/Providers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Paylaşılan linkler (profil/spotlight/dizin/davet) Telegram & sosyal medyada
// zengin önizleme kartı olarak görünsün diye sayfa başına metadata + OG.
// metadataBase olmadan OG görsel URL'leri göreli kalır ve crawler'lar çözemez.
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const [app, home] = await Promise.all([
    getTranslations({ locale, namespace: "app" }),
    getTranslations({ locale, namespace: "home" }),
  ]);
  const name = app("name");
  const tagline = home("tagline");
  const description = home("description");

  return {
    metadataBase: new URL(APP_URL),
    title: {
      default: `${name} — ${tagline}`,
      template: `%s · ${name}`,
    },
    description,
    applicationName: name,
    openGraph: {
      type: "website",
      siteName: name,
      title: `${name} — ${tagline}`,
      description,
      url: `/${locale}`,
      locale,
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} — ${tagline}`,
      description,
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // Telegram webview <html>'e --tg-theme-* CSS değişkenlerini enjekte ettiği için
      // sunucu/istemci stil farkı oluşur; bu zararsız uyarıyı bastırırız.
      suppressHydrationWarning
    >
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <NextIntlClientProvider>
          <Providers>
            <Header />
            {children}
            <Footer />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

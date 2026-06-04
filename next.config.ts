import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  images: {
    // Telegram kullanıcı avatarları (t.me / telegram CDN) için
    remotePatterns: [
      { protocol: "https", hostname: "t.me" },
      { protocol: "https", hostname: "**.telegram.org" },
    ],
  },
};

export default withNextIntl(nextConfig);

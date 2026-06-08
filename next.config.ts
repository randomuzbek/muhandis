import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Dev modunda Mini App'e HTTPS tüneli (cloudflared/ngrok) üzerinden erişildiğinde
  // Next.js client JS/HMR isteklerini engellemesin diye tünel host'larına izin ver.
  allowedDevOrigins: ["*.trycloudflare.com", "*.ngrok-free.app", "*.ngrok.io"],
  images: {
    // Telegram kullanıcı avatarları (t.me / telegram CDN) için
    remotePatterns: [
      { protocol: "https", hostname: "t.me" },
      { protocol: "https", hostname: "**.telegram.org" },
    ],
  },
};

export default withNextIntl(nextConfig);

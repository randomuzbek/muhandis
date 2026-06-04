import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // API, Next dahili yolları, bot webhook ve statik dosyalar hariç her şey
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};

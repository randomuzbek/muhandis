import { createHmac } from "node:crypto";

// Telegram Mini App'ten gelen initData'nın geçerliliğini bot token ile doğrular.
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  is_premium?: boolean;
}

export interface ValidatedInitData {
  user: TelegramUser;
  authDate: Date;
  // Mini App `?startapp=` ile açıldığında gelen parametre (ör. "ref_<userId>").
  startParam?: string;
  raw: string;
}

const MAX_AGE_SECONDS = 60 * 60 * 24; // initData en fazla 24 saat geçerli

export function validateInitData(
  initData: string,
  botToken: string,
  maxAgeSeconds: number = MAX_AGE_SECONDS,
): ValidatedInitData {
  if (!initData) throw new Error("initData boş.");
  if (!botToken) throw new Error("Bot token tanımlı değil.");

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) throw new Error("initData içinde hash yok.");

  // hash hariç tüm alanları alfabetik sırayla "key=value" olarak birleştir
  const pairs: string[] = [];
  for (const [key, value] of params.entries()) {
    if (key === "hash") continue;
    pairs.push(`${key}=${value}`);
  }
  pairs.sort();
  const dataCheckString = pairs.join("\n");

  // secret_key = HMAC_SHA256(key="WebAppData", message=botToken)
  const secretKey = createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();
  const computedHash = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (computedHash !== hash) {
    throw new Error("initData imzası geçersiz.");
  }

  // Tazelik kontrolü
  const authDateRaw = params.get("auth_date");
  if (!authDateRaw) throw new Error("auth_date yok.");
  const authDateSeconds = Number(authDateRaw);
  const ageSeconds = Math.floor(Date.now() / 1000) - authDateSeconds;
  if (ageSeconds > maxAgeSeconds) {
    throw new Error("initData süresi dolmuş.");
  }

  const userRaw = params.get("user");
  if (!userRaw) throw new Error("initData içinde user yok.");
  const user = JSON.parse(userRaw) as TelegramUser;

  return {
    user,
    authDate: new Date(authDateSeconds * 1000),
    startParam: params.get("start_param") ?? undefined,
    raw: initData,
  };
}

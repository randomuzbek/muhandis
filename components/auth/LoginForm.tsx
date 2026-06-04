"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { signIn } from "next-auth/react";

export function LoginForm({ locale }: { locale: string }) {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const callbackUrl = `/${locale}/profile`;

  const inputClass =
    "w-full rounded-lg border border-foreground/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/40";

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm opacity-70">{t("miniAppOnly")}</p>

      <button
        onClick={() => signIn("google", { callbackUrl })}
        className="rounded-full border border-foreground/20 px-5 py-2.5 text-sm font-medium hover:bg-foreground/5"
      >
        {t("withGoogle")}
      </button>

      <div className="my-2 h-px bg-foreground/10" />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setLoading(true);
          void signIn("password", { email, password, callbackUrl });
        }}
        className="flex flex-col gap-3"
      >
        <input
          type="email"
          required
          placeholder={t("email")}
          className={inputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          required
          placeholder={t("password")}
          className={inputClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background disabled:opacity-50"
        >
          {loading ? t("loading") : t("withEmail")}
        </button>
      </form>
    </div>
  );
}

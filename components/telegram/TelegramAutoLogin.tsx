"use client";

import { useEffect, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import { useTelegram } from "./TelegramProvider";

// Mini App içinde initData varsa ve oturum yoksa otomatik (sürtünmesiz) giriş yapar.
export function TelegramAutoLogin() {
  const { isMiniApp, initData } = useTelegram();
  const { status } = useSession();
  const tried = useRef(false);

  useEffect(() => {
    if (!isMiniApp || !initData) return;
    if (status !== "unauthenticated") return;
    if (tried.current) return;
    tried.current = true;
    void signIn("telegram-miniapp", { initData, redirect: false });
  }, [isMiniApp, initData, status]);

  return null;
}

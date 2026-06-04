"use client";

import { SessionProvider } from "next-auth/react";
import { TelegramProvider } from "@/components/telegram/TelegramProvider";
import { TelegramAutoLogin } from "@/components/telegram/TelegramAutoLogin";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TelegramProvider>
        <TelegramAutoLogin />
        {children}
      </TelegramProvider>
    </SessionProvider>
  );
}

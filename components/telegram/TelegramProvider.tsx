"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { TelegramThemeParams } from "@/types/telegram-webapp";

interface TelegramContextValue {
  isMiniApp: boolean;
  initData: string | null;
  colorScheme: "light" | "dark";
}

const initialState: TelegramContextValue = {
  isMiniApp: false,
  initData: null,
  colorScheme: "light",
};

const TelegramContext = createContext<TelegramContextValue>(initialState);

export function useTelegram() {
  return useContext(TelegramContext);
}

// Telegram theme parametrelerini CSS değişkenlerine yansıtır
function applyTheme(theme: TelegramThemeParams) {
  const root = document.documentElement;
  const map: Record<string, string | undefined> = {
    "--background": theme.bg_color,
    "--foreground": theme.text_color,
    "--tg-hint": theme.hint_color,
    "--tg-link": theme.link_color,
    "--tg-button": theme.button_color,
    "--tg-button-text": theme.button_text_color,
    "--tg-secondary-bg": theme.secondary_bg_color,
  };
  for (const [key, value] of Object.entries(map)) {
    if (value) root.style.setProperty(key, value);
  }
}

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TelegramContextValue>(initialState);

  useEffect(() => {
    const wa = window.Telegram?.WebApp;
    // Mini App bağlamı yalnızca gerçek initData varsa kabul edilir
    if (!wa || !wa.initData) return;

    wa.ready();
    wa.expand();
    applyTheme(wa.themeParams);
    // Harici sistem (Telegram WebApp) ile mount anında senkronizasyon
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({
      isMiniApp: true,
      initData: wa.initData,
      colorScheme: wa.colorScheme,
    });

    const onThemeChanged = () => {
      applyTheme(wa.themeParams);
      setState((s) => ({ ...s, colorScheme: wa.colorScheme }));
    };
    wa.onEvent("themeChanged", onThemeChanged);
    return () => wa.offEvent("themeChanged", onThemeChanged);
  }, []);

  return (
    <TelegramContext.Provider value={state}>
      {children}
    </TelegramContext.Provider>
  );
}

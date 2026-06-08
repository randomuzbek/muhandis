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

// Telegram tema parametrelerini resmi --tg-theme-* CSS değişkenlerine yansıtır
// (Telegram bunları genelde kendi enjekte eder; bu bir yedektir).
function applyTheme(theme: TelegramThemeParams) {
  const root = document.documentElement;
  const map: Record<string, string | undefined> = {
    "--tg-theme-bg-color": theme.bg_color,
    "--tg-theme-text-color": theme.text_color,
    "--tg-theme-hint-color": theme.hint_color,
    "--tg-theme-link-color": theme.link_color,
    "--tg-theme-button-color": theme.button_color,
    "--tg-theme-button-text-color": theme.button_text_color,
    "--tg-theme-secondary-bg-color": theme.secondary_bg_color,
    "--tg-theme-section-bg-color": theme.section_bg_color,
    "--tg-theme-section-header-text-color": theme.section_header_text_color,
    "--tg-theme-subtitle-text-color": theme.subtitle_text_color,
    "--tg-theme-accent-text-color": theme.accent_text_color,
    "--tg-theme-destructive-text-color": theme.destructive_text_color,
    "--tg-theme-header-bg-color": theme.header_bg_color,
  };
  for (const [key, value] of Object.entries(map)) {
    if (value) root.style.setProperty(key, value);
  }
}

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TelegramContextValue>(initialState);

  useEffect(() => {
    const wa = window.Telegram?.WebApp;
    if (!wa || !wa.initData) return;

    wa.ready();
    wa.expand();
    applyTheme(wa.themeParams);
    document.documentElement.setAttribute("data-theme", wa.colorScheme);
    // Kaydırmada uygulamayı yanlışlıkla küçültmeyi engelle (varsa).
    (wa as unknown as { disableVerticalSwipes?: () => void }).disableVerticalSwipes?.();

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({
      isMiniApp: true,
      initData: wa.initData,
      colorScheme: wa.colorScheme,
    });

    const onThemeChanged = () => {
      applyTheme(wa.themeParams);
      document.documentElement.setAttribute("data-theme", wa.colorScheme);
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

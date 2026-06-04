"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { TelegramThemeParams } from "@/types/telegram-webapp";

interface TelegramContextValue {
  isMiniApp: boolean;
  initData: string | null;
  colorScheme: "light" | "dark";
}

const TelegramContext = createContext<TelegramContextValue>({
  isMiniApp: false,
  initData: null,
  colorScheme: "light",
});

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
  const [isMiniApp, setIsMiniApp] = useState(false);
  const [initData, setInitData] = useState<string | null>(null);
  const [colorScheme, setColorScheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const wa = window.Telegram?.WebApp;
    // Mini App bağlamı yalnızca gerçek initData varsa kabul edilir
    if (!wa || !wa.initData) return;

    wa.ready();
    wa.expand();
    setIsMiniApp(true);
    setInitData(wa.initData);
    setColorScheme(wa.colorScheme);
    applyTheme(wa.themeParams);

    const onThemeChanged = () => {
      setColorScheme(wa.colorScheme);
      applyTheme(wa.themeParams);
    };
    wa.onEvent("themeChanged", onThemeChanged);
    return () => wa.offEvent("themeChanged", onThemeChanged);
  }, []);

  const value = useMemo(
    () => ({ isMiniApp, initData, colorScheme }),
    [isMiniApp, initData, colorScheme],
  );

  return (
    <TelegramContext.Provider value={value}>
      {children}
    </TelegramContext.Provider>
  );
}

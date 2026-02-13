import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  getInitialTheme,
  getSystemTheme,
  resolveTheme,
  THEME_STORAGE_KEY,
  type ThemeMode,
  type ResolvedTheme,
} from "@/lib/theme";

const ThemeContext = createContext<{
  mode: ThemeMode;
  resolved: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
} | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const initial = getInitialTheme(
    typeof window === "undefined" ? null : window.localStorage,
    typeof window === "undefined"
      ? null
      : window.matchMedia("(prefers-color-scheme: dark)")
  );

  const [mode, setMode] = useState<ThemeMode>(initial.mode);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(initial.resolved);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setSystemTheme(getSystemTheme(media));
    update();
    if ("addEventListener" in media) media.addEventListener("change", update);
    else media.addListener(update);
    return () => {
      if ("removeEventListener" in media) media.removeEventListener("change", update);
      else media.removeListener(update);
    };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // ignore storage errors
    }
  }, [mode]);

  const resolved = resolveTheme(mode, systemTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
  }, [resolved]);

  const value = useMemo(() => ({ mode, resolved, setMode }), [mode, resolved]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

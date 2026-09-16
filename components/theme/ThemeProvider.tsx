"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";

export type Theme = "dark" | "light" | "system";
type ResolvedTheme = Exclude<Theme, "system">;
type ThemeContextValue = { theme: Theme; resolvedTheme: ResolvedTheme; setTheme: (theme: Theme) => void; toggleTheme: () => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);

function readTheme(): Theme {
  const saved = window.localStorage.getItem("clausum-theme");
  return saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
}

function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme !== "system") return theme;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("clausum-theme-change", onStoreChange);
      return () => window.removeEventListener("clausum-theme-change", onStoreChange);
    },
    (): Theme => {
      return readTheme();
    },
    (): Theme => "system",
  );
  const resolvedTheme = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("clausum-theme-change", onStoreChange);
      const media = window.matchMedia("(prefers-color-scheme: light)");
      media.addEventListener("change", onStoreChange);
      return () => { window.removeEventListener("clausum-theme-change", onStoreChange); media.removeEventListener("change", onStoreChange); };
    },
    (): ResolvedTheme => resolveTheme(theme),
    (): ResolvedTheme => "dark",
  );
  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
  }, [resolvedTheme]);
  const setTheme = (next: Theme) => {
    window.localStorage.setItem("clausum-theme", next);
    document.documentElement.dataset.theme = resolveTheme(next);
    window.dispatchEvent(new Event("clausum-theme-change"));
  };
  const value = useMemo(() => ({
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme: () => setTheme(theme === "dark" ? "light" : theme === "light" ? "system" : "dark"),
  }), [theme, resolvedTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() { const context = useContext(ThemeContext); if (!context) throw new Error("useTheme must be used inside ThemeProvider"); return context; }

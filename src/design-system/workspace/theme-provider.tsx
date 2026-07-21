"use client";

import * as React from "react";

/**
 * Theme Engine formalizado: os tokens semânticos + arquivos de tema (ver
 * docs/02-hierarchy-and-theming.md) já existiam desde a Onda 1. O que faltava era um
 * ponto único e programático para setar `data-theme`, em vez de cada produto escrever
 * isso manualmente no `<html>`. Relevante sobretudo para o SaaS multi-tenant: no
 * futuro, o tema pode variar por organização logada, não só por produto.
 */
const ThemeContext = React.createContext<{ theme: string; setTheme: (t: string) => void } | null>(null);

export function ThemeProvider({ theme, children }: { theme: string; children: React.ReactNode }) {
  React.useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const [current, setCurrent] = React.useState(theme);
  const value = React.useMemo(
    () => ({
      theme: current,
      setTheme: (t: string) => {
        document.documentElement.dataset.theme = t;
        setCurrent(t);
      },
    }),
    [current]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme precisa estar dentro de <ThemeProvider>");
  return ctx;
}

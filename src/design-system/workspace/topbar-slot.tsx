"use client";

import * as React from "react";
import { useShell } from "./_shell-context";

/**
 * Qualquer página dentro da Content Layer usa isto para aparecer na Topbar sem
 * precisar que o layout (que monta a Topbar uma única vez) saiba nada sobre ela.
 * Limpa o slot ao desmontar — navegar para outra página não deixa breadcrumb velho
 * na tela por um frame.
 */
export function TopbarSlot({ children }: { children: React.ReactNode }) {
  const { setTopbarLeft } = useShell();

  React.useEffect(() => {
    setTopbarLeft(children);
    return () => setTopbarLeft(null);
  }, [children, setTopbarLeft]);

  return null;
}

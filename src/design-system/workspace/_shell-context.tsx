"use client";

import * as React from "react";
import { useMediaQuery } from "../primitives/use-media-query";

/**
 * Estado técnico do Shell (colapso da sidebar, drawer mobile aberto/fechado, breakpoint
 * atual). Interno — nem Navigation Layer nem Content Layer deveriam precisar importar
 * isto diretamente; ShellSidebar e ShellTopbar leem via useShell().
 */
interface ShellState {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (v: boolean) => void;
  isMobile: boolean;
  /** Slot dinâmico: páginas injetam aqui (via <TopbarSlot>) o que a Topbar, montada
      uma única vez pelo layout, deve mostrar à esquerda — normalmente o Breadcrumb. */
  topbarLeft: React.ReactNode;
  setTopbarLeft: (node: React.ReactNode) => void;
}

const ShellContext = React.createContext<ShellState | null>(null);

export function ShellProvider({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [topbarLeft, setTopbarLeft] = React.useState<React.ReactNode>(null);
  const isMobile = useMediaQuery("(max-width: 1023px)");

  const value = React.useMemo(
    () => ({ sidebarCollapsed, setSidebarCollapsed, mobileNavOpen, setMobileNavOpen, isMobile, topbarLeft, setTopbarLeft }),
    [sidebarCollapsed, mobileNavOpen, isMobile, topbarLeft]
  );

  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export function useShell() {
  const ctx = React.useContext(ShellContext);
  if (!ctx) throw new Error("useShell precisa estar dentro de <ShellProvider>");
  return ctx;
}

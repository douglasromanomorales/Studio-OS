"use client";

import * as React from "react";
import { WifiOff } from "lucide-react";
import { cn } from "../lib/cn";

/**
 * StatusBar é opcional (nem todo produto CodeChain precisa) — mas quando montada,
 * cobre o critério de qualidade "comportamento offline" com o mínimo real: detectar
 * e comunicar, não tentar sincronizar dado offline (isso é trabalho de uma camada de
 * cache/fila própria, fora de escopo do Workspace — YAGNI até um módulo pedir).
 */
export function StatusBar({ children, className }: { children?: React.ReactNode; className?: string }) {
  const isOnline = useOnlineStatus();

  return (
    <footer
      className={cn(
        "h-7 shrink-0 border-t border-[var(--border)] bg-[var(--surface-card)] px-4",
        "flex items-center justify-between text-xs text-[var(--text-muted)]",
        className
      )}
    >
      <div className="flex items-center gap-3">{children}</div>
      {!isOnline && (
        <span role="status" className="flex items-center gap-1.5 text-[var(--warning)]">
          <WifiOff className="h-3.5 w-3.5" aria-hidden />
          Sem conexão — algumas ações podem falhar até a rede voltar
        </span>
      )}
    </footer>
  );
}

function useOnlineStatus() {
  const [online, setOnline] = React.useState(true);
  React.useEffect(() => {
    setOnline(navigator.onLine);
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);
  return online;
}

"use client";

import * as React from "react";
import { cn } from "../lib/cn";
import { ShellProvider } from "./_shell-context";

/**
 * ShellRoot — infraestrutura técnica pura. Não sabe o que é "Studio OS", não conhece
 * nomes de módulo, não decide o que vai dentro da Sidebar/Topbar — só monta o grid e
 * fornece o contexto de estado (colapso, mobile) que ShellSidebar/ShellTopbar leem.
 * `Workspace` (workspace-provider.tsx) é quem configura a experiência por cima disto.
 */
export function ShellRoot({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <ShellProvider>
      <a
        href="#shell-content"
        className={cn(
          "sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200]",
          "focus:rounded-[var(--radius-sm)] focus:bg-[var(--brand)] focus:text-[var(--text-on-brand)] focus:px-4 focus:py-2 focus:text-sm"
        )}
      >
        Pular para o conteúdo
      </a>
      <div className={cn("h-screen w-screen flex overflow-hidden bg-[var(--surface-page)]", className)}>
        {children}
      </div>
    </ShellProvider>
  );
}

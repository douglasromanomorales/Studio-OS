"use client";

import * as React from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "../lib/cn";
import { useShell } from "./_shell-context";
import { useKeyboardShortcut } from "../primitives/_use-keyboard-shortcut";
import { IconButton } from "../primitives/icon-button";
import { SimpleTooltip } from "../primitives/tooltip";
import { Sheet, SheetContent } from "../primitives/sheet";

export interface ShellSidebarProps {
  children: React.ReactNode;
  /** Conteúdo do topo da sidebar (normalmente o WorkspaceSwitcher). */
  header?: React.ReactNode;
  /** Conteúdo do rodapé (normalmente o UserMenu). */
  footer?: React.ReactNode;
  collapsedWidth?: number;
  expandedWidth?: number;
}

/**
 * Navigation Layer — não conhece o Content Layer, só recebe `children` (a navegação
 * em si, ver `workspace/sidebar-nav.tsx`). Responsiva: em desktop é uma coluna
 * persistente que colapsa para ícone-only (⌘B, convenção VS Code/Linear); em mobile
 * vira um Sheet lateral — reaproveitando o Sheet da Onda 3.5, nenhum overlay novo.
 */
export function ShellSidebar({ children, header, footer, collapsedWidth = 72, expandedWidth = 260 }: ShellSidebarProps) {
  const { sidebarCollapsed, setSidebarCollapsed, mobileNavOpen, setMobileNavOpen, isMobile } = useShell();
  useKeyboardShortcut("b", () => setSidebarCollapsed(!sidebarCollapsed));

  const content = (
    <div className="flex h-full flex-col">
      {header && <div className="p-3 border-b border-[var(--border)]">{header}</div>}
      <nav aria-label="Navegação principal" className="flex-1 overflow-y-auto p-3">
        {children}
      </nav>
      {footer && <div className="p-3 border-t border-[var(--border)]">{footer}</div>}
      {!isMobile && (
        <div className="p-2 border-t border-[var(--border)] flex justify-end">
          <SimpleTooltip label={sidebarCollapsed ? "Expandir (⌘B)" : "Colapsar (⌘B)"}>
            <IconButton
              aria-label={sidebarCollapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
              variant="default"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
            </IconButton>
          </SimpleTooltip>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="max-w-[280px] p-0">
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside
      className={cn(
        "h-full shrink-0 border-r border-[var(--border)] bg-[var(--surface-card)]",
        "transition-[width] duration-[var(--dur-slow)] ease-[var(--ease-product)]"
      )}
      style={{ width: sidebarCollapsed ? collapsedWidth : expandedWidth }}
    >
      {content}
    </aside>
  );
}

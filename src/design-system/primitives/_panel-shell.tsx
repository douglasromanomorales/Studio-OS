"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "../lib/cn";
import { IconButton } from "./icon-button";

/**
 * Casca de painel deslizante — usada por Sheet (modal, lado direito por padrão),
 * Drawer (modal, preset para lado inferior, uso mobile), SidePanel (não-modal, fica
 * aberto enquanto a pessoa interage com o resto da tela) e QuickCreate (Sheet +
 * header/footer padronizados para criação rápida). Interno — nunca API pública.
 *
 * Modal vs. não-modal é a única diferença de comportamento entre Sheet e SidePanel;
 * Radix Dialog resolve isso nativamente via `modal={false}` — não precisamos de uma
 * engine própria de foco/scroll-lock, o Radix já é o motor aqui.
 */
export const PanelRoot = DialogPrimitive.Root;
export const PanelTrigger = DialogPrimitive.Trigger;

const SIDE_STYLES = {
  right: "inset-y-0 right-0 h-full w-full max-w-md border-l data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
  left: "inset-y-0 left-0 h-full w-full max-w-md border-r data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left",
  bottom:
    "inset-x-0 bottom-0 w-full max-h-[85vh] rounded-t-[var(--radius-lg)] border-t data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
} as const;

export type PanelSide = keyof typeof SIDE_STYLES;

export interface PanelContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  side?: PanelSide;
  showClose?: boolean;
  /** Painel não-modal: página permanece interativa, sem overlay escuro (padrão do SidePanel). */
  showOverlay?: boolean;
}

export function PanelContent({
  className,
  children,
  side = "right",
  showClose = true,
  showOverlay = true,
  ...props
}: PanelContentProps) {
  return (
    <DialogPrimitive.Portal>
      {showOverlay && (
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-[var(--surface-overlay)]",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
          )}
        />
      )}
      <DialogPrimitive.Content
        className={cn(
          "fixed z-50 flex flex-col bg-[var(--surface-card)] border-[var(--border)] shadow-[var(--shadow-lg)]",
          "data-[state=open]:animate-in data-[state=closed]:animate-out duration-[var(--dur-slow)] ease-[var(--ease-product)]",
          "focus-visible:outline-none",
          SIDE_STYLES[side],
          className
        )}
        {...props}
      >
        {children}
        {showClose && (
          <DialogPrimitive.Close asChild>
            <IconButton aria-label="Fechar" variant="default" size="sm" className="absolute top-4 right-4">
              <X />
            </IconButton>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function PanelHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 pt-6 pb-4 pr-12 border-b border-[var(--border)]", className)} {...props} />;
}

export function PanelTitle({ className, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn("font-[var(--font-display)] text-lg text-[var(--text-primary)]", className)}
      {...props}
    />
  );
}

export function PanelDescription({ className, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn("text-sm text-[var(--text-secondary)] mt-1", className)} {...props} />;
}

export function PanelBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex-1 overflow-y-auto px-6 py-5", className)} {...props} />;
}

export function PanelFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center justify-end gap-2 px-6 py-4 border-t border-[var(--border)]", className)} {...props} />
  );
}

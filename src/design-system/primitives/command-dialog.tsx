"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "../lib/cn";
import { ComboboxCommand, ComboboxInput, ComboboxList, ComboboxEmpty, ComboboxItem } from "./_combobox-shell";

/**
 * CommandDialog — nenhum comportamento novo. É Dialog centralizado (overlay, foco
 * travado) hospedando as mesmas primitivas de Command já usadas por Combobox/
 * MultiSelect/TimePicker desde a Onda 3b. Esta é a base literal do Command Palette
 * do App Shell (⌘K) — quando essa camada nascer, ela só alimenta este componente com
 * comandos específicos do produto, sem precisar de nenhuma peça nova.
 */
export const CommandDialog = DialogPrimitive.Root;
export { ComboboxInput as CommandDialogInput, ComboboxList as CommandDialogList, ComboboxEmpty as CommandDialogEmpty, ComboboxItem as CommandDialogItem };

export function CommandDialogContent({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className={cn(
          "fixed inset-0 z-50 bg-[var(--surface-overlay)]",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
        )}
      />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-[18vh] z-50 w-full max-w-xl -translate-x-1/2",
          "rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-card)] shadow-[var(--shadow-lg)] overflow-hidden",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
          "focus-visible:outline-none",
          className
        )}
        {...props}
      >
        <ComboboxCommand>{children}</ComboboxCommand>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

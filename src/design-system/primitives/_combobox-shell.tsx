"use client";

import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { cn } from "../lib/cn";
import { PopoverRoot, PopoverTriggerPrimitive, PopoverShellContent } from "./_popover-shell";

/**
 * Módulo interno — NÃO é API pública. Casca de busca+lista repetida entre Combobox,
 * MultiSelect e TimePicker. A casca de popover em si (borda/sombra/animação) agora
 * vem de _popover-shell, extraída nesta onda porque Popover (público, novo) precisava
 * exatamente da mesma coisa — duplicação real, não antecipada.
 */

export const ComboboxPopover = PopoverRoot;
export const ComboboxPopoverTrigger = PopoverTriggerPrimitive;

export function ComboboxPopoverContent({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof PopoverShellContent>) {
  return (
    <PopoverShellContent matchTriggerWidth className={className} {...props}>
      {children}
    </PopoverShellContent>
  );
}

export const ComboboxCommand = CommandPrimitive;

export function ComboboxInput(props: React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>) {
  return (
    <div className="flex items-center border-b border-[var(--border)] px-3">
      <CommandPrimitive.Input
        className={cn(
          "h-10 w-full bg-transparent text-sm text-[var(--text-primary)] outline-none",
          "placeholder:text-[var(--text-muted)]"
        )}
        {...props}
      />
    </div>
  );
}

export function ComboboxList({ className, ...props }: React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>) {
  return <CommandPrimitive.List className={cn("max-h-64 overflow-y-auto p-1", className)} {...props} />;
}

export function ComboboxEmpty({ children }: { children: React.ReactNode }) {
  return (
    <CommandPrimitive.Empty className="py-6 text-center text-sm text-[var(--text-muted)]">
      {children}
    </CommandPrimitive.Empty>
  );
}

export function ComboboxItem({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      className={cn(
        "flex items-center gap-2 rounded-[var(--radius-xs)] px-2.5 py-2 text-sm text-[var(--text-primary)]",
        "cursor-pointer select-none",
        "data-[selected=true]:bg-[var(--surface-sunken)]",
        "data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
        className
      )}
      {...props}
    />
  );
}

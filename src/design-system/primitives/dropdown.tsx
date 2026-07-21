"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check } from "lucide-react";
import { cn } from "../lib/cn";
import { floatingSurfaceClass } from "./_floating-surface-style";

/**
 * Dropdown — menu de ações contextuais ("..." de uma linha de tabela, menu de
 * usuário). Semântica ARIA `menu`/`menuitem` (Up/Down navega, type-ahead por letra,
 * Enter ativa) — diferente de Combobox (`listbox`) e de Popover (conteúdo livre).
 * Por isso usa o primitivo Radix DropdownMenu, não o Popover — mas a aparência vem
 * do mesmo `floatingSurfaceClass` usado por Popover Shell, sem duplicar a string.
 */
export const Dropdown = DropdownMenuPrimitive.Root;
export const DropdownTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownGroup = DropdownMenuPrimitive.Group;

export function DropdownContent({
  className,
  sideOffset = 6,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        sideOffset={sideOffset}
        className={cn(floatingSurfaceClass, "min-w-[180px] p-1", className)}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

export function DropdownItem({
  className,
  destructive,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & { destructive?: boolean }) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        "flex items-center gap-2 rounded-[var(--radius-xs)] px-2.5 py-2 text-sm cursor-pointer outline-none",
        "text-[var(--text-primary)] data-[highlighted]:bg-[var(--surface-sunken)]",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        destructive && "text-[var(--danger)] data-[highlighted]:bg-[var(--danger-subtle)]",
        className
      )}
      {...props}
    />
  );
}

export function DropdownCheckboxItem({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      className={cn(
        "flex items-center gap-2 rounded-[var(--radius-xs)] pl-8 pr-2.5 py-2 text-sm cursor-pointer outline-none relative",
        "text-[var(--text-primary)] data-[highlighted]:bg-[var(--surface-sunken)]",
        className
      )}
      {...props}
    >
      <DropdownMenuPrimitive.ItemIndicator className="absolute left-2.5">
        <Check className="h-3.5 w-3.5 text-[var(--brand)]" />
      </DropdownMenuPrimitive.ItemIndicator>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

export function DropdownSeparator({ className, ...props }: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>) {
  return <DropdownMenuPrimitive.Separator className={cn("my-1 h-px bg-[var(--border)]", className)} {...props} />;
}

export function DropdownLabel({ className, ...props }: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>) {
  return (
    <DropdownMenuPrimitive.Label
      className={cn("px-2.5 py-1.5 text-xs font-medium text-[var(--text-muted)]", className)}
      {...props}
    />
  );
}

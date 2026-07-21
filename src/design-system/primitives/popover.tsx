"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "../lib/cn";
import { PopoverRoot, PopoverTriggerPrimitive, PopoverShellContent, PopoverAnchor } from "./_popover-shell";
import { IconButton } from "./icon-button";

/**
 * Popover — conteúdo flutuante ancorado a um trigger, não-modal (não bloqueia
 * interação com o resto da página, fecha ao clicar fora). Diferente de Dialog: não
 * tem overlay escuro, não trava foco na página inteira, é para conteúdo leve e
 * contextual (um menu de opções, uma prévia, um formulário curto de 1-2 campos).
 *
 * Quando NÃO usar: formulário longo ou ação que precisa de confirmação explícita
 * (isso é Dialog/Sheet); lista pesquisável (isso é Combobox, que já resolve o padrão
 * completo com input+lista).
 */
export const Popover = PopoverRoot;
export const PopoverTrigger = PopoverTriggerPrimitive;
export const PopoverAnchorRoot = PopoverAnchor;

export interface PopoverContentProps extends React.ComponentPropsWithoutRef<typeof PopoverShellContent> {
  showClose?: boolean;
}

export function PopoverContent({ className, children, showClose = false, ...props }: PopoverContentProps) {
  return (
    <PopoverShellContent className={cn("p-4 w-72", className)} {...props}>
      {showClose && (
        <IconButton aria-label="Fechar" variant="default" size="sm" className="absolute top-2 right-2">
          <X />
        </IconButton>
      )}
      {children}
    </PopoverShellContent>
  );
}

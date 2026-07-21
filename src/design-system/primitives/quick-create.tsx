"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody, SheetFooter } from "./sheet";
import { Button } from "./button";

export interface QuickCreateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  onSubmit: () => void;
  submitLabel?: string;
  loading?: boolean;
  submitDisabled?: boolean;
}

/**
 * QuickCreate resolve diretamente o achado #3 do relatório de validação do módulo
 * Consultas: "cadastrar novo cliente sem sair da tela". Zero engine nova — é Sheet
 * com header/footer padronizados para o padrão de criação rápida, que se repete em
 * qualquer módulo (criar cliente a partir de um Combobox, criar produto a partir do
 * Estoque, criar categoria a partir de Serviços).
 */
export function QuickCreate({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  submitLabel = "Criar",
  loading = false,
  submitDisabled = false,
}: QuickCreateProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        onSubmit={(e: React.FormEvent) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <SheetBody>
          <div className="flex flex-col gap-5">{children}</div>
        </SheetBody>
        <SheetFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} loading={loading} disabled={submitDisabled}>
            {submitLabel}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

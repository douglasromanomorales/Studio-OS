"use client";

import * as React from "react";
import {
  CommandDialog,
  CommandDialogContent,
  CommandDialogInput,
  CommandDialogList,
  CommandDialogEmpty,
  CommandDialogItem,
} from "./command-dialog";
import { useKeyboardShortcut } from "./_use-keyboard-shortcut";

export interface CommandPaletteItem {
  id: string;
  label: string;
  group?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  onSelect: () => void;
}

export interface CommandPaletteProps {
  items: CommandPaletteItem[];
  /** Combinação que abre a paleta — padrão ⌘K (Mac) / Ctrl+K (Windows/Linux), como convenção do mercado (Linear, Raycast, Vercel). */
  shortcutKey?: string;
  emptyText?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Zero peça nova de comportamento — é CommandDialog (Onda 3.5) mais um listener
 * global de teclado. `items` é genérico (label/ícone/atalho/callback); o App Shell
 * futuro só precisa montar a lista com as rotas/ações do Studio OS, sem que este
 * componente saiba o que é "Agenda" ou "Consulta".
 */
export function CommandPalette({ items, shortcutKey = "k", emptyText = "Nenhum comando encontrado.", open: controlledOpen, onOpenChange }: CommandPaletteProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  // Escape para fechar não precisa de listener próprio — Radix Dialog (base do
  // CommandDialog) já fecha em Escape nativamente. Um segundo listener aqui seria
  // duplicação de comportamento que o Radix já resolve.
  useKeyboardShortcut(shortcutKey, () => setOpen(!open));

  const groups = React.useMemo(() => {
    const map = new Map<string, CommandPaletteItem[]>();
    for (const item of items) {
      const key = item.group ?? "Geral";
      map.set(key, [...(map.get(key) ?? []), item]);
    }
    return map;
  }, [items]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandDialogContent aria-label="Paleta de comandos">
        <CommandDialogInput placeholder="Digite um comando ou busque..." />
        <CommandDialogList>
          <CommandDialogEmpty>{emptyText}</CommandDialogEmpty>
          {Array.from(groups.entries()).map(([group, groupItems]) => (
            <div key={group}>
              <p className="px-2.5 pt-2.5 pb-1 text-xs font-medium text-[var(--text-muted)]">{group}</p>
              {groupItems.map((item) => (
                <CommandDialogItem
                  key={item.id}
                  value={item.label}
                  onSelect={() => {
                    item.onSelect();
                    setOpen(false);
                  }}
                >
                  {item.icon}
                  <span className="flex-1">{item.label}</span>
                  {item.shortcut && <span className="text-xs text-[var(--text-muted)]">{item.shortcut}</span>}
                </CommandDialogItem>
              ))}
            </div>
          ))}
        </CommandDialogList>
      </CommandDialogContent>
    </CommandDialog>
  );
}

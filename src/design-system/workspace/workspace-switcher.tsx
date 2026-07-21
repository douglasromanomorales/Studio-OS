"use client";

import * as React from "react";
import { ChevronsUpDown, Check, Plus } from "lucide-react";
import { cn } from "../lib/cn";
import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem, DropdownSeparator, DropdownLabel } from "../primitives/dropdown";
import { Avatar } from "../primitives/avatar";

export interface WorkspaceOption {
  id: string;
  name: string;
  logoUrl?: string;
}

export interface WorkspaceSwitcherProps {
  current: WorkspaceOption;
  options: WorkspaceOption[];
  onSwitch: (id: string) => void;
  onCreateNew?: () => void;
}

/**
 * Consumidor direto da arquitetura multi-tenant do Studio OS (Organization). Recebe
 * a lista de organizações já carregada — não sabe como buscar dado, só apresenta.
 */
export function WorkspaceSwitcher({ current, options, onSwitch, onCreateNew }: WorkspaceSwitcherProps) {
  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <button
          className={cn(
            "flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-2 py-2 text-left",
            "hover:bg-[var(--surface-sunken)] transition-colors duration-[var(--dur-fast)] ease-[var(--ease-product)]",
            "focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
          )}
        >
          <Avatar name={current.name} src={current.logoUrl} size="sm" />
          <span className="flex-1 min-w-0 truncate text-sm font-medium text-[var(--text-primary)]">{current.name}</span>
          <ChevronsUpDown className="h-4 w-4 text-[var(--text-muted)] shrink-0" aria-hidden />
        </button>
      </DropdownTrigger>
      <DropdownContent align="start" className="w-64">
        <DropdownLabel>Organizações</DropdownLabel>
        {options.map((org) => (
          <DropdownItem key={org.id} onSelect={() => onSwitch(org.id)} className="gap-2.5">
            <Avatar name={org.name} src={org.logoUrl} size="xs" />
            <span className="flex-1 truncate">{org.name}</span>
            {org.id === current.id && <Check className="h-4 w-4 text-[var(--brand)]" />}
          </DropdownItem>
        ))}
        {onCreateNew && (
          <>
            <DropdownSeparator />
            <DropdownItem onSelect={onCreateNew} className="gap-2.5">
              <Plus className="h-4 w-4" />
              Nova organização
            </DropdownItem>
          </>
        )}
      </DropdownContent>
    </Dropdown>
  );
}

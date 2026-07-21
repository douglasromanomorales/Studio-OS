"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "../lib/cn";
import { Badge } from "./badge";
import {
  ComboboxPopover,
  ComboboxPopoverTrigger,
  ComboboxPopoverContent,
  ComboboxCommand,
  ComboboxInput,
  ComboboxList,
  ComboboxEmpty,
  ComboboxItem,
} from "./_combobox-shell";
import type { ComboboxOption } from "./combobox";

export interface MultiSelectProps {
  id?: string;
  options: ComboboxOption[];
  values: string[];
  onValuesChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: React.ReactNode;
  disabled?: boolean;
  /** Limite de tags visíveis no trigger antes de colapsar em "+N" — evita o trigger crescer sem controle. */
  maxVisibleTags?: number;
}

export function MultiSelect({
  id,
  options,
  values,
  onValuesChange,
  placeholder = "Selecionar...",
  searchPlaceholder = "Buscar...",
  emptyText = "Nenhum resultado.",
  disabled,
  maxVisibleTags = 3,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const selected = options.filter((o) => values.includes(o.value));
  const visible = selected.slice(0, maxVisibleTags);
  const overflow = selected.length - visible.length;

  function toggle(value: string) {
    onValuesChange(values.includes(value) ? values.filter((v) => v !== value) : [...values, value]);
  }

  return (
    <ComboboxPopover open={open} onOpenChange={setOpen}>
      <ComboboxPopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          className={cn(
            "flex min-h-11 w-full items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-[var(--border-strong)]",
            "bg-[var(--surface-card)] px-3 py-1.5 text-sm text-left flex-wrap",
            "transition-[border-color,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-product)]",
            "focus-visible:outline-none focus-visible:border-[var(--brand)] focus-visible:shadow-[var(--shadow-focus)]",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          <span className="flex flex-wrap gap-1.5 flex-1">
            {selected.length === 0 && <span className="text-[var(--text-muted)] py-1">{placeholder}</span>}
            {visible.map((o) => (
              <Badge key={o.value} variant="neutral" className="gap-1">
                {o.label}
                <span
                  role="button"
                  tabIndex={-1}
                  aria-label={`Remover ${o.label}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(o.value);
                  }}
                  className="hover:text-[var(--danger)]"
                >
                  <X className="h-3 w-3" />
                </span>
              </Badge>
            ))}
            {overflow > 0 && <Badge variant="outline">+{overflow}</Badge>}
          </span>
          <ChevronsUpDown className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
        </button>
      </ComboboxPopoverTrigger>
      <ComboboxPopoverContent>
        <ComboboxCommand>
          <ComboboxInput placeholder={searchPlaceholder} />
          <ComboboxList>
            <ComboboxEmpty>{emptyText}</ComboboxEmpty>
            {options.map((option) => {
              const isSelected = values.includes(option.value);
              return (
                <ComboboxItem
                  key={option.value}
                  value={option.label}
                  disabled={option.disabled}
                  onSelect={() => toggle(option.value)}
                >
                  <Check className={cn("h-4 w-4 shrink-0 text-[var(--brand)]", isSelected ? "opacity-100" : "opacity-0")} />
                  {option.label}
                </ComboboxItem>
              );
            })}
          </ComboboxList>
        </ComboboxCommand>
      </ComboboxPopoverContent>
    </ComboboxPopover>
  );
}

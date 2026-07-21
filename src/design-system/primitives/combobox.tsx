"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "../lib/cn";
import { Spinner } from "./divider-spinner";
import { useDebouncedCallback } from "./_use-debounced-callback";
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

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface ComboboxProps {
  id?: string;
  options: ComboboxOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  onSearch?: (query: string) => void;
  loading?: boolean;

  /**
   * Render props — cobrem os casos que antes exigiriam uma prop nova a cada pedido
   * (emptyText fixo, sem loading customizado, sem cabeçalho/rodapé). Todas opcionais;
   * ausência de qualquer uma preserva o comportamento padrão anterior. Mais
   * flexibilidade sem crescer a superfície obrigatória da API pública.
   */
  renderItem?: (option: ComboboxOption, state: { selected: boolean }) => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
  renderLoading?: () => React.ReactNode;
  renderHeader?: () => React.ReactNode;
  renderFooter?: () => React.ReactNode;
}

const defaultRenderItem: NonNullable<ComboboxProps["renderItem"]> = (option, { selected }) => (
  <>
    <Check className={cn("h-4 w-4 shrink-0 text-[var(--brand)]", selected ? "opacity-100" : "opacity-0")} />
    <span className="flex flex-col">
      <span>{option.label}</span>
      {option.description && <span className="text-xs text-[var(--text-muted)]">{option.description}</span>}
    </span>
  </>
);

export function Combobox({
  id,
  options,
  value,
  onValueChange,
  placeholder = "Selecionar...",
  searchPlaceholder = "Buscar...",
  disabled,
  onSearch,
  loading,
  renderItem = defaultRenderItem,
  renderEmpty,
  renderLoading,
  renderHeader,
  renderFooter,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const selected = options.find((o) => o.value === value);
  const debouncedSearch = useDebouncedCallback((q: string) => onSearch?.(q), 250);

  function handleInputChange(query: string) {
    if (!onSearch) return;
    debouncedSearch(query);
  }

  return (
    <ComboboxPopover open={open} onOpenChange={setOpen}>
      <ComboboxPopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-11 w-full items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-[var(--border-strong)]",
            "bg-[var(--surface-card)] px-4 text-sm text-left",
            "transition-[border-color,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-product)]",
            "focus-visible:outline-none focus-visible:border-[var(--brand)] focus-visible:shadow-[var(--shadow-focus)]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            selected ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"
          )}
        >
          {selected?.label ?? placeholder}
          <ChevronsUpDown className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
        </button>
      </ComboboxPopoverTrigger>
      <ComboboxPopoverContent>
        <ComboboxCommand shouldFilter={!onSearch}>
          {renderHeader?.()}
          <ComboboxInput placeholder={searchPlaceholder} onValueChange={handleInputChange} />
          <ComboboxList>
            {loading ? (
              renderLoading ? (
                renderLoading()
              ) : (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-[var(--text-muted)]">
                  <Spinner size="sm" /> Buscando...
                </div>
              )
            ) : (
              <>
                <ComboboxEmpty>{renderEmpty ? renderEmpty() : "Nenhum resultado."}</ComboboxEmpty>
                {options.map((option) => (
                  <ComboboxItem
                    key={option.value}
                    value={option.label}
                    disabled={option.disabled}
                    onSelect={() => {
                      onValueChange(option.value);
                      setOpen(false);
                    }}
                  >
                    {renderItem(option, { selected: option.value === value })}
                  </ComboboxItem>
                ))}
              </>
            )}
          </ComboboxList>
          {renderFooter?.()}
        </ComboboxCommand>
      </ComboboxPopoverContent>
    </ComboboxPopover>
  );
}

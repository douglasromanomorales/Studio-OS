"use client";

import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { cn } from "../lib/cn";
import { CalendarGrid } from "./_calendar-grid";
import { isSameDay, isWithinRange, type DateRange } from "./_calendar-engine";
import { ComboboxPopover, ComboboxPopoverTrigger, ComboboxPopoverContent } from "./_combobox-shell";

export interface DateRangePickerProps {
  value?: DateRange;
  onValueChange: (range: DateRange) => void;
  placeholder?: string;
  disabledDate?: (day: Date) => boolean;
  disabled?: boolean;
}

/**
 * Única diferença real em relação ao DatePicker: interpretar duas seleções em
 * sequência como início/fim de intervalo. A grade (CalendarGrid) é a mesma instância
 * de componente, com roving tabindex e teclado completo herdados sem duplicação.
 */
export function DateRangePicker({ value, onValueChange, placeholder = "Selecionar período", disabledDate, disabled }: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  function handleSelect(day: Date) {
    if (disabledDate?.(day)) return;
    if (!value?.from || (value.from && value.to)) {
      onValueChange({ from: day, to: undefined });
      return;
    }
    onValueChange({ from: value.from, to: day });
    setOpen(false);
  }

  const label = value?.from
    ? value.to
      ? `${format(value.from, "d MMM", { locale: ptBR })} – ${format(value.to, "d MMM yyyy", { locale: ptBR })}`
      : format(value.from, "d 'de' MMMM", { locale: ptBR })
    : placeholder;

  return (
    <ComboboxPopover open={open} onOpenChange={setOpen}>
      <ComboboxPopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-11 w-full items-center gap-2.5 rounded-[var(--radius-sm)] border border-[var(--border-strong)]",
            "bg-[var(--surface-card)] px-4 text-sm text-left",
            "transition-[border-color,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-product)]",
            "focus-visible:outline-none focus-visible:border-[var(--brand)] focus-visible:shadow-[var(--shadow-focus)]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            value?.from ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"
          )}
        >
          <CalendarDays className="h-4 w-4 text-[var(--text-muted)] shrink-0" aria-hidden />
          {label}
        </button>
      </ComboboxPopoverTrigger>
      <ComboboxPopoverContent className="w-auto">
        <CalendarGrid
          initialFocus={value?.from}
          onSelect={handleSelect}
          isSelected={(day) =>
            (value?.from ? isSameDay(day, value.from) : false) || (value?.to ? isSameDay(day, value.to) : false)
          }
          isRangeMiddle={(day) => (value ? isWithinRange(day, value) : false)}
          disabledDate={disabledDate}
        />
      </ComboboxPopoverContent>
    </ComboboxPopover>
  );
}

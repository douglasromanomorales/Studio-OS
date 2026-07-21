"use client";

import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { cn } from "../lib/cn";
import { CalendarGrid } from "./_calendar-grid";
import { isSameDay } from "./_calendar-engine";
import { ComboboxPopover, ComboboxPopoverTrigger, ComboboxPopoverContent } from "./_combobox-shell";

export interface DatePickerProps {
  id?: string;
  value?: Date;
  onValueChange: (date: Date) => void;
  placeholder?: string;
  disabledDate?: (day: Date) => boolean;
  disabled?: boolean;
}

export function DatePicker({ id, value, onValueChange, placeholder = "Selecionar data", disabledDate, disabled }: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <ComboboxPopover open={open} onOpenChange={setOpen}>
      <ComboboxPopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-11 w-full items-center gap-2.5 rounded-[var(--radius-sm)] border border-[var(--border-strong)]",
            "bg-[var(--surface-card)] px-4 text-sm text-left",
            "transition-[border-color,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-product)]",
            "focus-visible:outline-none focus-visible:border-[var(--brand)] focus-visible:shadow-[var(--shadow-focus)]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            value ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"
          )}
        >
          <CalendarDays className="h-4 w-4 text-[var(--text-muted)] shrink-0" aria-hidden />
          {value ? format(value, "d 'de' MMMM 'de' yyyy", { locale: ptBR }) : placeholder}
        </button>
      </ComboboxPopoverTrigger>
      <ComboboxPopoverContent className="w-auto">
        <CalendarGrid
          initialFocus={value}
          onSelect={(day) => {
            if (disabledDate?.(day)) return;
            onValueChange(day);
            setOpen(false);
          }}
          isSelected={(day) => (value ? isSameDay(day, value) : false)}
          disabledDate={disabledDate}
        />
      </ComboboxPopoverContent>
    </ComboboxPopover>
  );
}

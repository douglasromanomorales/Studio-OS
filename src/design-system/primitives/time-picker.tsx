"use client";

import * as React from "react";
import { Clock, Check } from "lucide-react";
import { cn } from "../lib/cn";
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

export interface TimePickerProps {
  id?: string;
  value?: string; // "HH:mm"
  onValueChange: (time: string) => void;
  /** Horário mínimo e máximo do intervalo gerado (padrão: expediente comum 08:00–20:00). */
  min?: string;
  max?: string;
  /** Intervalo entre horários gerados, em minutos. */
  stepMinutes?: number;
  placeholder?: string;
  disabled?: boolean;
}

function generateSlots(min: string, max: string, step: number): string[] {
  const [minH, minM] = min.split(":").map(Number);
  const [maxH, maxM] = max.split(":").map(Number);
  const slots: string[] = [];
  let totalMinutes = minH * 60 + minM;
  const end = maxH * 60 + maxM;
  while (totalMinutes <= end) {
    const h = Math.floor(totalMinutes / 60)
      .toString()
      .padStart(2, "0");
    const m = (totalMinutes % 60).toString().padStart(2, "0");
    slots.push(`${h}:${m}`);
    totalMinutes += step;
  }
  return slots;
}

/**
 * TimePicker não introduz nenhum motor novo — é o mesmo _combobox-shell usado por
 * Combobox e MultiSelect, aplicado a uma lista local gerada de horários. Não existia
 * duplicação a resolver aqui, então não existe implementação nova: só a API pública
 * que faz sentido para quem consome ("me dê um seletor de horário"), escondendo que
 * por baixo é a mesma peça de sempre.
 */
export function TimePicker({
  id,
  value,
  onValueChange,
  min = "08:00",
  max = "20:00",
  stepMinutes = 15,
  placeholder = "Selecionar horário",
  disabled,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const slots = React.useMemo(() => generateSlots(min, max, stepMinutes), [min, max, stepMinutes]);

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
          <Clock className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
          {value ?? placeholder}
        </button>
      </ComboboxPopoverTrigger>
      <ComboboxPopoverContent>
        <ComboboxCommand>
          <ComboboxInput placeholder="Buscar horário..." />
          <ComboboxList>
            <ComboboxEmpty>Nenhum horário encontrado.</ComboboxEmpty>
            {slots.map((slot) => (
              <ComboboxItem
                key={slot}
                value={slot}
                onSelect={() => {
                  onValueChange(slot);
                  setOpen(false);
                }}
              >
                <Check className={cn("h-4 w-4 shrink-0 text-[var(--brand)]", slot === value ? "opacity-100" : "opacity-0")} />
                {slot}
              </ComboboxItem>
            ))}
          </ComboboxList>
        </ComboboxCommand>
      </ComboboxPopoverContent>
    </ComboboxPopover>
  );
}

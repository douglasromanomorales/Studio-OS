"use client";

import * as React from "react";
import { format, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../lib/cn";
import { IconButton } from "./icon-button";
import {
  getMonthGrid,
  isSameDay,
  isSameMonth,
  interpretCalendarKey,
  applyCalendarMove,
  type CalendarMoveUnit,
} from "./_calendar-engine";

/**
 * Camada de UI da Calendar Engine — o único arquivo que sabe que React/DOM existem.
 * Implementa roving tabindex (não aria-activedescendant — ver justificativa no chat
 * que motivou esta correção e no relatório de hardening): só a célula com foco
 * "lógico" tem tabIndex=0, o resto tem -1; ao mover com teclado, o DOM focus real é
 * transferido via ref + .focus() imperativo, que é o padrão correto de grid do
 * WAI-ARIA APG.
 */

const WEEKDAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];

export interface CalendarGridProps {
  isSelected: (day: Date) => boolean;
  isRangeMiddle?: (day: Date) => boolean;
  onSelect: (day: Date) => void;
  disabledDate?: (day: Date) => boolean;
  /** Data inicial de foco ao abrir — normalmente o valor selecionado, ou hoje se nada estiver selecionado. */
  initialFocus?: Date;
}

export function CalendarGrid({ isSelected, isRangeMiddle, onSelect, disabledDate, initialFocus }: CalendarGridProps) {
  const [focusedDate, setFocusedDate] = React.useState(() => initialFocus ?? new Date());
  const [announce, setAnnounce] = React.useState("");
  const cellRefs = React.useRef(new Map<string, HTMLButtonElement>());
  const shouldRefocus = React.useRef(false);

  const days = getMonthGrid(focusedDate);
  const monthLabel = format(focusedDate, "MMMM yyyy", { locale: ptBR });

  // Foco persistente: só move o foco real do DOM quando a mudança veio do teclado
  // (shouldRefocus), nunca em cliques de mouse — evita roubar foco à toa.
  React.useEffect(() => {
    if (!shouldRefocus.current) return;
    shouldRefocus.current = false;
    const key = format(focusedDate, "yyyy-MM-dd");
    cellRefs.current.get(key)?.focus();
  }, [focusedDate]);

  function moveFocus(unit: CalendarMoveUnit, direction: 1 | -1) {
    const next = applyCalendarMove(focusedDate, unit, direction);
    shouldRefocus.current = true;
    setFocusedDate(next);
    if (!isSameMonth(next, focusedDate)) {
      setAnnounce(format(next, "MMMM yyyy", { locale: ptBR }));
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    const action = interpretCalendarKey(e.key, e.shiftKey);
    if (!action) return;
    e.preventDefault();
    if (action.type === "select") {
      if (!disabledDate?.(focusedDate)) onSelect(focusedDate);
      return;
    }
    moveFocus(action.unit, action.direction);
  }

  return (
    <div className="p-3 w-[280px]">
      <div className="flex items-center justify-between mb-3">
        <IconButton
          aria-label="Mês anterior"
          variant="default"
          size="sm"
          onClick={() => moveFocus("month", -1)}
        >
          <ChevronLeft />
        </IconButton>
        <span className="text-sm font-medium text-[var(--text-primary)] capitalize" aria-hidden>
          {monthLabel}
        </span>
        <IconButton aria-label="Próximo mês" variant="default" size="sm" onClick={() => moveFocus("month", 1)}>
          <ChevronRight />
        </IconButton>
      </div>

      {/* Anúncio de troca de mês/ano para quem navega por teclado sem ver a tela — o
          rótulo visual acima é aria-hidden porque esta região já cobre o mesmo dado
          de forma mais previsível para leitor de tela (só anuncia quando muda). */}
      <div aria-live="polite" className="sr-only">
        {announce}
      </div>

      <div role="grid" aria-label={`Calendário, ${monthLabel}`} onKeyDown={handleKeyDown}>
        <div role="row" className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAY_LABELS.map((label, i) => (
            <div key={i} role="columnheader" className="h-8 flex items-center justify-center text-xs text-[var(--text-muted)]">
              {label}
            </div>
          ))}
        </div>

        {Array.from({ length: days.length / 7 }, (_, week) => (
          <div role="row" key={week} className="grid grid-cols-7 gap-1">
            {days.slice(week * 7, week * 7 + 7).map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const outside = !isSameMonth(day, focusedDate);
              const disabled = disabledDate?.(day) ?? false;
              const selected = isSelected(day);
              const middle = isRangeMiddle?.(day) ?? false;
              const isRovingTarget = isSameDay(day, focusedDate);

              return (
                <button
                  key={key}
                  ref={(el) => {
                    if (el) cellRefs.current.set(key, el);
                    else cellRefs.current.delete(key);
                  }}
                  role="gridcell"
                  type="button"
                  tabIndex={isRovingTarget ? 0 : -1}
                  aria-selected={selected}
                  aria-current={isToday(day) ? "date" : undefined}
                  aria-label={format(day, "d 'de' MMMM 'de' yyyy, EEEE", { locale: ptBR })}
                  disabled={disabled}
                  onFocus={() => setFocusedDate(day)}
                  onClick={() => onSelect(day)}
                  className={cn(
                    "h-8 w-8 rounded-[var(--radius-xs)] text-sm transition-colors duration-[var(--dur-fast)] ease-[var(--ease-product)]",
                    "focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
                    outside && "text-[var(--text-muted)]",
                    !outside && !selected && "text-[var(--text-primary)] hover:bg-[var(--surface-sunken)]",
                    isToday(day) && !selected && "font-semibold text-[var(--brand)]",
                    middle && "bg-[var(--brand-subtle)] rounded-none",
                    selected && "bg-[var(--brand)] text-[var(--text-on-brand)] hover:bg-[var(--brand-hover)]",
                    disabled && "opacity-35 pointer-events-none"
                  )}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

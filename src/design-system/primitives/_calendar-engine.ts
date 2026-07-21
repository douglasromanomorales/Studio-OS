import {
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  addYears,
  subYears,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  isBefore,
} from "date-fns";

/**
 * Calendar Engine — comportamento puro. Corrigido nesta rodada: a versão anterior
 * (`_calendar-engine.tsx`) renderizava JSX diretamente, violando o princípio Headless
 * First desde que nasceu — só não tinha sido pego porque a regra "Engine nunca conhece
 * JSX/CSS/DOM" foi formalizada depois. Este arquivo não importa React.
 */

export type DateRange = { from?: Date; to?: Date };

export function getMonthGrid(month: Date): Date[] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
  return eachDayOfInterval({ start, end });
}

export function isWithinRange(day: Date, range: DateRange): boolean {
  if (!range.from || !range.to) return false;
  if (isBefore(range.to, range.from)) return isWithinInterval(day, { start: range.to, end: range.from });
  return isWithinInterval(day, { start: range.from, end: range.to });
}

export { isSameDay, isSameMonth };

/**
 * Interpretação de teclado seguindo o padrão WAI-ARIA APG "Date Picker Dialog":
 * setas movem um dia/semana, Home/End vão para início/fim da semana corrente,
 * PageUp/PageDown trocam de mês, Shift+PageUp/PageDown trocam de ano. Recebe
 * strings (key, shiftKey), nunca um KeyboardEvent — não depende do DOM.
 */
export type CalendarMoveUnit = "day" | "week" | "weekStart" | "weekEnd" | "month" | "year";
export type CalendarAction = { type: "move"; unit: CalendarMoveUnit; direction: 1 | -1 } | { type: "select" } | null;

export function interpretCalendarKey(key: string, shiftKey: boolean): CalendarAction {
  switch (key) {
    case "ArrowRight":
      return { type: "move", unit: "day", direction: 1 };
    case "ArrowLeft":
      return { type: "move", unit: "day", direction: -1 };
    case "ArrowDown":
      return { type: "move", unit: "week", direction: 1 };
    case "ArrowUp":
      return { type: "move", unit: "week", direction: -1 };
    case "Home":
      return { type: "move", unit: "weekStart", direction: -1 };
    case "End":
      return { type: "move", unit: "weekEnd", direction: 1 };
    case "PageUp":
      return { type: "move", unit: shiftKey ? "year" : "month", direction: -1 };
    case "PageDown":
      return { type: "move", unit: shiftKey ? "year" : "month", direction: 1 };
    case "Enter":
    case " ":
      return { type: "select" };
    default:
      return null;
  }
}

export function applyCalendarMove(date: Date, unit: CalendarMoveUnit, direction: 1 | -1): Date {
  switch (unit) {
    case "day":
      return direction === 1 ? addDays(date, 1) : subDays(date, 1);
    case "week":
      return direction === 1 ? addWeeks(date, 1) : subWeeks(date, 1);
    case "weekStart":
      return startOfWeek(date, { weekStartsOn: 0 });
    case "weekEnd":
      return endOfWeek(date, { weekStartsOn: 0 });
    case "month":
      return direction === 1 ? addMonths(date, 1) : subMonths(date, 1);
    case "year":
      return direction === 1 ? addYears(date, 1) : subYears(date, 1);
  }
}

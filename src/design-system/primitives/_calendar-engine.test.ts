import { describe, it, expect } from "vitest";
import {
  getMonthGrid,
  isWithinRange,
  interpretCalendarKey,
  applyCalendarMove,
} from "./_calendar-engine";

describe("getMonthGrid", () => {
  it("sempre retorna semanas completas (múltiplo de 7)", () => {
    const grid = getMonthGrid(new Date(2026, 6, 1)); // julho 2026
    expect(grid.length % 7).toBe(0);
  });

  it("inclui os últimos dias do mês anterior e primeiros do seguinte quando necessário", () => {
    const grid = getMonthGrid(new Date(2026, 6, 1));
    expect(grid[0].getMonth()).not.toBe(6); // primeira célula é de junho
    expect(grid[grid.length - 1].getMonth()).not.toBe(6); // última é de agosto
  });
});

describe("isWithinRange", () => {
  it("identifica um dia dentro do intervalo", () => {
    const range = { from: new Date(2026, 6, 1), to: new Date(2026, 6, 10) };
    expect(isWithinRange(new Date(2026, 6, 5), range)).toBe(true);
  });

  it("funciona com o intervalo selecionado ao contrário (to antes de from)", () => {
    const range = { from: new Date(2026, 6, 10), to: new Date(2026, 6, 1) };
    expect(isWithinRange(new Date(2026, 6, 5), range)).toBe(true);
  });

  it("retorna false sem os dois extremos definidos", () => {
    expect(isWithinRange(new Date(2026, 6, 5), { from: new Date(2026, 6, 1) })).toBe(false);
  });
});

describe("interpretCalendarKey — padrão WAI-ARIA APG Date Picker", () => {
  it("setas movem dia/semana", () => {
    expect(interpretCalendarKey("ArrowRight", false)).toEqual({ type: "move", unit: "day", direction: 1 });
    expect(interpretCalendarKey("ArrowLeft", false)).toEqual({ type: "move", unit: "day", direction: -1 });
    expect(interpretCalendarKey("ArrowDown", false)).toEqual({ type: "move", unit: "week", direction: 1 });
    expect(interpretCalendarKey("ArrowUp", false)).toEqual({ type: "move", unit: "week", direction: -1 });
  });

  it("Home/End vão para início/fim da semana", () => {
    expect(interpretCalendarKey("Home", false)).toEqual({ type: "move", unit: "weekStart", direction: -1 });
    expect(interpretCalendarKey("End", false)).toEqual({ type: "move", unit: "weekEnd", direction: 1 });
  });

  it("PageUp/PageDown trocam de mês sem Shift", () => {
    expect(interpretCalendarKey("PageUp", false)).toEqual({ type: "move", unit: "month", direction: -1 });
    expect(interpretCalendarKey("PageDown", false)).toEqual({ type: "move", unit: "month", direction: 1 });
  });

  it("Shift+PageUp/PageDown trocam de ano", () => {
    expect(interpretCalendarKey("PageUp", true)).toEqual({ type: "move", unit: "year", direction: -1 });
    expect(interpretCalendarKey("PageDown", true)).toEqual({ type: "move", unit: "year", direction: 1 });
  });

  it("Enter e Espaço selecionam", () => {
    expect(interpretCalendarKey("Enter", false)).toEqual({ type: "select" });
    expect(interpretCalendarKey(" ", false)).toEqual({ type: "select" });
  });

  it("tecla irrelevante retorna null", () => {
    expect(interpretCalendarKey("a", false)).toBeNull();
  });
});

describe("applyCalendarMove", () => {
  const base = new Date(2026, 6, 15); // 15 de julho de 2026 (quarta-feira)

  it("move um dia", () => {
    expect(applyCalendarMove(base, "day", 1).getDate()).toBe(16);
    expect(applyCalendarMove(base, "day", -1).getDate()).toBe(14);
  });

  it("move uma semana", () => {
    expect(applyCalendarMove(base, "week", 1).getDate()).toBe(22);
  });

  it("vai para início/fim da semana (domingo a sábado)", () => {
    expect(applyCalendarMove(base, "weekStart", -1).getDay()).toBe(0);
    expect(applyCalendarMove(base, "weekEnd", 1).getDay()).toBe(6);
  });

  it("troca de mês preservando o dia quando possível", () => {
    const next = applyCalendarMove(base, "month", 1);
    expect(next.getMonth()).toBe(7); // agosto
  });

  it("troca de ano", () => {
    const next = applyCalendarMove(base, "year", 1);
    expect(next.getFullYear()).toBe(2027);
  });
});

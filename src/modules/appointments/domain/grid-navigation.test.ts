import { describe, it, expect } from "vitest";
import { interpretAgendaGridKey, clampPosition } from "./grid-navigation";

describe("interpretAgendaGridKey — semântica invertida em relação ao calendário", () => {
  it("cima/baixo move horário (row), nunca semana", () => {
    expect(interpretAgendaGridKey("ArrowDown")).toEqual({ type: "move", row: 1 });
    expect(interpretAgendaGridKey("ArrowUp")).toEqual({ type: "move", row: -1 });
  });

  it("esquerda/direita move profissional (col), nunca dia", () => {
    expect(interpretAgendaGridKey("ArrowRight")).toEqual({ type: "move", col: 1 });
    expect(interpretAgendaGridKey("ArrowLeft")).toEqual({ type: "move", col: -1 });
  });

  it("Enter/Espaço seleciona", () => {
    expect(interpretAgendaGridKey("Enter")).toEqual({ type: "select" });
  });
});

describe("clampPosition", () => {
  it("nunca sai dos limites da grade", () => {
    expect(clampPosition({ row: -5, col: -5 }, 10, 3)).toEqual({ row: 0, col: 0 });
    expect(clampPosition({ row: 99, col: 99 }, 10, 3)).toEqual({ row: 10, col: 3 });
  });
});

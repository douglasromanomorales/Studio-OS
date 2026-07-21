import { describe, it, expect } from "vitest";
import { clampToStep, interpretNumberKey, canIncrement, canDecrement } from "./_number-value-engine";

describe("clampToStep", () => {
  it("limita ao máximo", () => {
    expect(clampToStep(150, { min: 0, max: 100, step: 1 })).toBe(100);
  });

  it("limita ao mínimo", () => {
    expect(clampToStep(-10, { min: 0, max: 100, step: 1 })).toBe(0);
  });

  it("arredonda para o step mais próximo", () => {
    expect(clampToStep(23, { min: 0, max: 100, step: 5 })).toBe(25);
    expect(clampToStep(22, { min: 0, max: 100, step: 5 })).toBe(20);
  });

  it("respeita precisão decimal", () => {
    expect(clampToStep(19.999, { min: 0, max: 100, step: 0.5, precision: 2 })).toBe(20);
  });

  it("sem constraints, retorna o valor sem alteração (dentro do step padrão de 1)", () => {
    expect(clampToStep(42, {})).toBe(42);
  });
});

describe("interpretNumberKey", () => {
  it("mapeia ArrowUp e ArrowRight para incremento", () => {
    expect(interpretNumberKey("ArrowUp")).toBe("increment");
    expect(interpretNumberKey("ArrowRight")).toBe("increment");
  });

  it("mapeia ArrowDown e ArrowLeft para decremento", () => {
    expect(interpretNumberKey("ArrowDown")).toBe("decrement");
    expect(interpretNumberKey("ArrowLeft")).toBe("decrement");
  });

  it("mapeia Home/End para os extremos", () => {
    expect(interpretNumberKey("Home")).toBe("min");
    expect(interpretNumberKey("End")).toBe("max");
  });

  it("teclas irrelevantes retornam null", () => {
    expect(interpretNumberKey("a")).toBeNull();
    expect(interpretNumberKey("Enter")).toBeNull();
  });
});

describe("canIncrement / canDecrement", () => {
  it("bloqueia incremento no teto", () => {
    expect(canIncrement(100, 1, 100)).toBe(false);
    expect(canIncrement(99, 1, 100)).toBe(true);
  });

  it("bloqueia decremento no piso", () => {
    expect(canDecrement(0, 1, 0)).toBe(false);
    expect(canDecrement(1, 1, 0)).toBe(true);
  });

  it("sem limite definido, sempre permite", () => {
    expect(canIncrement(999999, 1, undefined)).toBe(true);
    expect(canDecrement(-999999, 1, undefined)).toBe(true);
  });
});

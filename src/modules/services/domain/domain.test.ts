import { describe, it, expect } from "vitest";
import { resolvePriceStrategy, validarDuracao } from "./value-objects";
import { requiresConsultation, isBookableDirectly, servicoDisponivel, sessionsRemaining } from "./specifications";

describe("VO PriceStrategy", () => {
  it("resolve FIXED com valor em centavos", () => {
    expect(resolvePriceStrategy("FIXED", 129.9)).toEqual({ mode: "FIXED", amountCents: 12990 });
  });

  it("resolve QUOTE_REQUIRED sem valor", () => {
    expect(resolvePriceStrategy("QUOTE_REQUIRED", null)).toEqual({ mode: "QUOTE_REQUIRED" });
  });

  it("FIXED sem preço é dado inconsistente — falha alto, não silenciosamente", () => {
    expect(() => resolvePriceStrategy("FIXED", null)).toThrow();
  });
});

describe("VO Duration", () => {
  it("aceita inteiro positivo", () => {
    expect(validarDuracao(60).valid).toBe(true);
  });
  it("rejeita zero, negativo e fracionário", () => {
    expect(validarDuracao(0).valid).toBe(false);
    expect(validarDuracao(-10).valid).toBe(false);
    expect(validarDuracao(60.5).valid).toBe(false);
  });
});

describe("Derived Over Stored — requiresConsultation nunca é campo próprio", () => {
  it("QUOTE_REQUIRED implica consulta", () => {
    expect(requiresConsultation({ mode: "QUOTE_REQUIRED" })).toBe(true);
    expect(isBookableDirectly({ mode: "QUOTE_REQUIRED" })).toBe(false);
  });

  it("FIXED é agendável direto, sem consulta", () => {
    expect(requiresConsultation({ mode: "FIXED", amountCents: 1000 })).toBe(false);
    expect(isBookableDirectly({ mode: "FIXED", amountCents: 1000 })).toBe(true);
  });
});

describe("servicoDisponivel — Temporal Truth, nunca boolean active", () => {
  it("sem data de descontinuação, está disponível", () => {
    expect(servicoDisponivel(null)).toBe(true);
  });
  it("com data de descontinuação, não está", () => {
    expect(servicoDisponivel(new Date())).toBe(false);
  });
});

describe("sessionsRemaining — derivado, nunca contador armazenado", () => {
  it("calcula a partir do total e do uso", () => {
    expect(sessionsRemaining(10, 3)).toBe(7);
  });
  it("nunca fica negativo mesmo com uso além do total (dado inconsistente não vira número negativo confuso)", () => {
    expect(sessionsRemaining(5, 8)).toBe(0);
  });
});

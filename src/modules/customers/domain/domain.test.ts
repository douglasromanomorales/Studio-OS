import { describe, it, expect } from "vitest";
import { normalizarTelefone, telefonesIguais, formatarTelefone } from "./value-objects";
import { existeTesteMechasValido, clienteInativo, clienteEmRisco } from "./specifications";
import { subDays, addDays } from "date-fns";

describe("VO Telefone", () => {
  it("normaliza formatos diferentes para o mesmo E.164", () => {
    expect(normalizarTelefone("(13) 97413-9126")).toBe("5513974139126");
    expect(normalizarTelefone("5513974139126")).toBe("5513974139126");
  });

  it("igualdade por valor normalizado", () => {
    expect(telefonesIguais("(13) 97413-9126", "5513974139126")).toBe(true);
    expect(telefonesIguais("(13) 97413-9126", "(13) 97413-9127")).toBe(false);
  });

  it("rejeita entrada inválida", () => {
    expect(normalizarTelefone("123")).toBeNull();
  });

  it("formata de volta para exibição", () => {
    expect(formatarTelefone("5513974139126")).toBe("(13) 97413-9126");
  });
});

describe("Specification: existeTesteMechasValido (Temporal Truth)", () => {
  const hoje = new Date(2026, 6, 16);

  it("registro sem expiração é válido", () => {
    expect(existeTesteMechasValido([{ performedAt: subDays(hoje, 30), validUntil: null }], hoje)).toBe(true);
  });

  it("registro expirado NÃO vale — é isto que o boolean antigo não conseguia expressar", () => {
    expect(existeTesteMechasValido([{ performedAt: subDays(hoje, 200), validUntil: subDays(hoje, 10) }], hoje)).toBe(false);
  });

  it("sem registro nenhum, não há teste válido", () => {
    expect(existeTesteMechasValido([], hoje)).toBe(false);
  });
});

describe("Specifications de inatividade — derivadas, nunca persistidas", () => {
  const hoje = new Date(2026, 6, 16);

  it("dentro do padrão de retorno: nem em risco nem inativa", () => {
    const h = { ultimoAtendimento: subDays(hoje, 10), intervaloTipicoDias: 20 };
    expect(clienteEmRisco(h, hoje)).toBe(false);
    expect(clienteInativo(h, hoje)).toBe(false);
  });

  it("passou do padrão mas não da margem: em risco, ainda não inativa", () => {
    const h = { ultimoAtendimento: subDays(hoje, 25), intervaloTipicoDias: 20 };
    expect(clienteEmRisco(h, hoje)).toBe(true);
    expect(clienteInativo(h, hoje)).toBe(false);
  });

  it("passou da margem: inativa", () => {
    const h = { ultimoAtendimento: subDays(hoje, 40), intervaloTipicoDias: 20 };
    expect(clienteInativo(h, hoje)).toBe(true);
  });

  it("sem histórico, nunca classifica (Lead não é inativa)", () => {
    expect(clienteInativo({ ultimoAtendimento: null, intervaloTipicoDias: null }, hoje)).toBe(false);
  });
});

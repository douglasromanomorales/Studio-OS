import { describe, it, expect } from "vitest";
import { validarCorAgenda, corAgendaPadrao, validarComissao } from "./value-objects";
import { temCredencialValida, podeExecutarServico, profissionalAtiva, estaDeFeriasOuLicenca } from "./specifications";
import { addDays, subDays } from "date-fns";

describe("VO CorAgenda", () => {
  it("rejeita hex inválido", () => {
    expect(validarCorAgenda("azul").valid).toBe(false);
  });

  it("rejeita cor clara demais (contraste insuficiente)", () => {
    expect(validarCorAgenda("#FFFFFF").valid).toBe(false);
  });

  it("aceita cor com contraste adequado", () => {
    expect(validarCorAgenda("#B85A3D").valid).toBe(true);
  });

  it("gera cor padrão determinística — mesmo nome, mesma cor sempre", () => {
    expect(corAgendaPadrao("Nataly Rodrigues")).toBe(corAgendaPadrao("Nataly Rodrigues"));
  });
});

describe("VO ComissaoBase", () => {
  it("aceita range válido", () => {
    expect(validarComissao(35).valid).toBe(true);
  });
  it("rejeita negativo e acima de 100", () => {
    expect(validarComissao(-1).valid).toBe(false);
    expect(validarComissao(101).valid).toBe(false);
  });
});

describe("Capability Provenance — temCredencialValida", () => {
  const hoje = new Date(2026, 6, 16);

  it("credencial sem validade definida é sempre válida", () => {
    expect(temCredencialValida([{ name: "Toxina Botulínica", validUntil: null }], "Toxina Botulínica", hoje)).toBe(true);
  });

  it("credencial vencida não é válida — nenhum boolean estático conseguiria expressar isso", () => {
    expect(
      temCredencialValida([{ name: "Toxina Botulínica", validUntil: subDays(hoje, 1) }], "Toxina Botulínica", hoje)
    ).toBe(false);
  });

  it("sem a credencial pelo nome, não vale mesmo com outras credenciais válidas", () => {
    expect(temCredencialValida([{ name: "Micropigmentação", validUntil: null }], "Toxina Botulínica", hoje)).toBe(false);
  });
});

describe("podeExecutarServico — Policy padrão embutida", () => {
  const hoje = new Date(2026, 6, 16);

  it("serviço sem exigência: qualquer profissional pode, mesmo sem credenciais", () => {
    expect(podeExecutarServico([], { requiresCredential: null }, hoje)).toBe(true);
  });

  it("serviço com exigência e sem credencial correspondente: não pode", () => {
    expect(podeExecutarServico([], { requiresCredential: "Toxina Botulínica" }, hoje)).toBe(false);
  });

  it("serviço com exigência e credencial válida: pode", () => {
    expect(
      podeExecutarServico([{ name: "Toxina Botulínica", validUntil: addDays(hoje, 30) }], { requiresCredential: "Toxina Botulínica" }, hoje)
    ).toBe(true);
  });
});

describe("Estados derivados", () => {
  it("profissionalAtiva depende só de terminatedAt", () => {
    expect(profissionalAtiva(null)).toBe(true);
    expect(profissionalAtiva(new Date())).toBe(false);
  });

  it("estaDeFeriasOuLicenca considera intervalo aberto-fechado", () => {
    const hoje = new Date(2026, 6, 16);
    expect(estaDeFeriasOuLicenca([{ startAt: subDays(hoje, 2), endAt: addDays(hoje, 2) }], hoje)).toBe(true);
    expect(estaDeFeriasOuLicenca([{ startAt: addDays(hoje, 5), endAt: addDays(hoje, 10) }], hoje)).toBe(false);
  });
});

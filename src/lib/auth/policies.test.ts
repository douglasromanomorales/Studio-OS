import { describe, it, expect } from "vitest";
import { hasCapability, requireCapability, AuthorizationError } from "./policies";

describe("hasCapability — RBAC como constante em código", () => {
  it("OWNER tem todas as capacidades", () => {
    expect(hasCapability("OWNER", "financeiro.gerenciar")).toBe(true);
    expect(hasCapability("OWNER", "configuracoes.gerenciar")).toBe(true);
  });

  it("RECEPTION não tem acesso a financeiro", () => {
    expect(hasCapability("RECEPTION", "financeiro.gerenciar")).toBe(false);
  });

  it("PROFESSIONAL só vê a própria comissão, nunca o financeiro completo", () => {
    expect(hasCapability("PROFESSIONAL", "financeiro.ver_propria_comissao")).toBe(true);
    expect(hasCapability("PROFESSIONAL", "financeiro.gerenciar")).toBe(false);
  });

  it("FINANCE gerencia financeiro mas não profissionais", () => {
    expect(hasCapability("FINANCE", "financeiro.gerenciar")).toBe(true);
    expect(hasCapability("FINANCE", "profissionais.gerenciar")).toBe(false);
  });

  it("achado do retrofit: todo papel operacional precisa ler o catálogo de serviços, mesmo sem gerenciá-lo", () => {
    expect(hasCapability("RECEPTION", "servicos.ver")).toBe(true);
    expect(hasCapability("PROFESSIONAL", "servicos.ver")).toBe(true);
    expect(hasCapability("RECEPTION", "servicos.gerenciar")).toBe(false);
  });
});

describe("requireCapability", () => {
  it("não lança quando o papel tem a capacidade", () => {
    expect(() => requireCapability("OWNER", "clientes.gerenciar")).not.toThrow();
  });

  it("lança AuthorizationError quando o papel não tem a capacidade", () => {
    expect(() => requireCapability("RECEPTION", "financeiro.gerenciar")).toThrow(AuthorizationError);
  });
});

import { describe, it, expect } from "vitest";
import { applyMask, stripNonDigits } from "./masked-input";
import { isValidCPF, isValidCNPJ, isValidCpfCnpj } from "./br-document-validators";

describe("applyMask", () => {
  it("aplica máscara de CPF progressivamente", () => {
    expect(applyMask("123", "###.###.###-##")).toBe("123");
    expect(applyMask("12345678900", "###.###.###-##")).toBe("123.456.789-00");
  });

  it("aplica máscara de telefone", () => {
    expect(applyMask("13974139126", "(##) #####-####")).toBe("(13) 97413-9126");
  });

  it("ignora dígitos além do que a máscara suporta", () => {
    expect(applyMask("1234567890123", "#####-###")).toBe("12345-678");
  });
});

describe("stripNonDigits", () => {
  it("remove tudo que não é dígito", () => {
    expect(stripNonDigits("(13) 97413-9126")).toBe("13974139126");
  });
});

describe("isValidCPF", () => {
  it("aceita um CPF válido conhecido", () => {
    expect(isValidCPF("52998224725")).toBe(true);
  });

  it("rejeita dígitos repetidos", () => {
    expect(isValidCPF("11111111111")).toBe(false);
  });

  it("rejeita dígito verificador incorreto", () => {
    expect(isValidCPF("52998224700")).toBe(false);
  });

  it("rejeita tamanho incorreto", () => {
    expect(isValidCPF("123")).toBe(false);
  });
});

describe("isValidCNPJ", () => {
  it("aceita um CNPJ válido conhecido", () => {
    expect(isValidCNPJ("11222333000181")).toBe(true);
  });

  it("rejeita dígitos repetidos", () => {
    expect(isValidCNPJ("11111111111111")).toBe(false);
  });

  it("rejeita dígito verificador incorreto", () => {
    expect(isValidCNPJ("11222333000199")).toBe(false);
  });
});

describe("isValidCpfCnpj", () => {
  it("roteia por tamanho para o validador certo", () => {
    expect(isValidCpfCnpj("52998224725")).toBe(true);
    expect(isValidCpfCnpj("11222333000181")).toBe(true);
    expect(isValidCpfCnpj("123")).toBe(false);
  });
});

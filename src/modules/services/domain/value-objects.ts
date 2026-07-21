/**
 * Value Objects do domínio Serviços. PriceStrategy é modelado como união
 * discriminada em código de domínio — o schema guarda `pricingMode` + `price`
 * (colunas simples, sem necessidade de JSON), e esta função é a única porta de
 * entrada para interpretar as duas colunas como um VO coeso, nunca lidas soltas
 * em cada lugar que precisa saber o preço.
 */

export type PriceStrategy =
  | { mode: "FIXED"; amountCents: number }
  | { mode: "QUOTE_REQUIRED" };

export function resolvePriceStrategy(pricingMode: "FIXED" | "QUOTE_REQUIRED", price: number | null): PriceStrategy {
  if (pricingMode === "FIXED") {
    if (price === null) throw new Error("Serviço FIXED sem preço definido — dado inconsistente, não deveria existir");
    return { mode: "FIXED", amountCents: Math.round(price * 100) };
  }
  return { mode: "QUOTE_REQUIRED" };
}

/** VO Duration — minutos, sempre positivo. */
export function validarDuracao(minutos: number): { valid: boolean; reason?: string } {
  if (!Number.isInteger(minutos) || minutos <= 0) {
    return { valid: false, reason: "Duração precisa ser um número inteiro de minutos maior que zero" };
  }
  return { valid: true };
}

/** VO Requirements — dado declarado; a validade de cada requisito é resolvida pelos domínios Cliente/Profissional. */
export interface Requirements {
  requiredCredential: string | null; // gate duro — Capability Provenance
  recommendedSpecialties: string[]; // sinal, nunca bloqueio
  requiresStrandTest: boolean;
}

export function buildRequirements(service: {
  requiresCredential: string | null;
  recommendedSpecialties: string[];
  requiresStrandTest: boolean;
}): Requirements {
  return {
    requiredCredential: service.requiresCredential,
    recommendedSpecialties: service.recommendedSpecialties,
    requiresStrandTest: service.requiresStrandTest,
  };
}

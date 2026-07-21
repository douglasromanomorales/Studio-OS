import type { PriceStrategy } from "./value-objects";

/**
 * Derived Over Stored aplicado: nenhuma destas respostas é uma coluna. Cada uma é
 * calculada a partir de fatos já persistidos (pricingMode, discontinuedAt), nunca
 * gravada separadamente — o que eliminaria o risco de divergir do fato original.
 */

/** requiresConsultation nunca foi campo próprio — é sempre isto. */
export function requiresConsultation(strategy: PriceStrategy): boolean {
  return strategy.mode === "QUOTE_REQUIRED";
}

export function isBookableDirectly(strategy: PriceStrategy): boolean {
  return !requiresConsultation(strategy);
}

/** Estado derivado — nunca boolean `active` armazenado. */
export function servicoDisponivel(discontinuedAt: Date | null): boolean {
  return discontinuedAt === null;
}

/**
 * Sessões restantes de um pacote comprado — SEMPRE derivado de
 * `sessionsTotal - count(PackageUsage)`, nunca um contador decrementado
 * manualmente. Reservado para quando CustomerPackage/PackageUsage forem
 * implementados (roadmap: Bundles/Pacotes, depois de Serviços) — a assinatura já
 * nasce certa para não repetir o erro do Teste de Mechas com um contador mutável.
 */
export function sessionsRemaining(sessionsTotal: number, usageCount: number): number {
  return Math.max(0, sessionsTotal - usageCount);
}

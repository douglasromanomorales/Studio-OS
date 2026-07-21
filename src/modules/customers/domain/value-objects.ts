/**
 * Value Objects do domínio Cliente — funções puras, zero dependência de framework
 * (mesmo padrão das engines da plataforma: testável com unit test e nada mais).
 */

/** VO Telefone — normaliza para E.164 brasileiro. Igualdade = valor normalizado. */
export function normalizarTelefone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  // 10-11 dígitos = nacional sem DDI; 12-13 começando com 55 = já tem DDI
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) return digits;
  return null; // inválido — o Application Service decide como reportar
}

export function telefonesIguais(a: string, b: string): boolean {
  const na = normalizarTelefone(a);
  const nb = normalizarTelefone(b);
  return na !== null && na === nb;
}

export function formatarTelefone(e164: string): string {
  const local = e164.startsWith("55") ? e164.slice(2) : e164;
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  return e164;
}

/** VO ConsentimentoLGPD — imutável; revogação é novo registro, nunca sobrescrita. */
export interface Consentimento {
  version: string;
  grantedAt: Date;
}

export const CONSENT_TERM_VERSION = "2026-07-v1";

export function novoConsentimento(): Consentimento {
  return { version: CONSENT_TERM_VERSION, grantedAt: new Date() };
}

import { isBefore } from "date-fns";

/**
 * Capability Provenance: nenhuma capacidade é um boolean. Toda pergunta "ela pode
 * fazer X?" passa por estas Specifications, nunca por um atributo solto.
 *
 * Formato deliberadamente igual a `existeTesteMechasValido` do domínio Cliente
 * (registros[].validUntil + "existe algum válido agora?") — mesma decisão de manter
 * separados até um terceiro consumidor real aparecer, aprovada explicitamente.
 */

export interface CredentialRecord {
  name: string;
  validUntil: Date | null;
}

export function temCredencialValida(credenciais: CredentialRecord[], nome: string, hoje = new Date()): boolean {
  return credenciais.some((c) => c.name === nome && (c.validUntil === null || !isBefore(c.validUntil, hoje)));
}

export interface ServicoComRequisito {
  requiresCredential: string | null;
}

/** A Policy padrão está embutida aqui: ausência de exigência = qualquer profissional pode. */
export function podeExecutarServico(
  credenciais: CredentialRecord[],
  servico: ServicoComRequisito,
  hoje = new Date()
): boolean {
  if (!servico.requiresCredential) return true;
  return temCredencialValida(credenciais, servico.requiresCredential, hoje);
}

/** Estado derivado — nunca persistido. */
export function profissionalAtiva(terminatedAt: Date | null): boolean {
  return terminatedAt === null;
}

export interface BlockInterval {
  startAt: Date;
  endAt: Date;
}

export function estaDeFeriasOuLicenca(blocks: BlockInterval[], hoje = new Date()): boolean {
  return blocks.some((b) => !isBefore(hoje, b.startAt) && isBefore(hoje, b.endAt));
}

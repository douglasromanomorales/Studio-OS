import { isBefore } from "date-fns";

/**
 * Domínio Quote (Orcamento no schema/código, mesmo padrão de Consulta/Cliente em
 * português). QuoteItem já nasce aplicando Derived Over Stored duas vezes: valor
 * total e duração estimada nunca são campos próprios, sempre soma dos itens.
 */

export interface OrcamentoItemData {
  serviceId: string;
  serviceNameSnapshot: string; // Snapshot Principle — evidência, nunca controla regra
  amountCents: number;
  durationMinutesSnapshot: number;
}

/** Derived Over Stored — valor total nunca é coluna própria. */
export function valorTotal(items: OrcamentoItemData[]): number {
  return items.reduce((sum, item) => sum + item.amountCents, 0);
}

/** Derived Over Stored — duração estimada nunca é coluna própria (aprovado nesta rodada). */
export function duracaoEstimada(items: OrcamentoItemData[]): number {
  return items.reduce((sum, item) => sum + item.durationMinutesSnapshot, 0);
}

export type OrcamentoStatus = "RASCUNHO" | "ENVIADO" | "APROVADO" | "RECUSADO";

export interface OrcamentoData {
  status: OrcamentoStatus;
  validoAte: Date | null;
}

/** EXPIRADO não é estado — é esta leitura. Só um Orçamento ENVIADO pode expirar; um já decidido (aprovado/recusado) é final. */
export function orcamentoExpirado(orcamento: OrcamentoData, hoje = new Date()): boolean {
  if (orcamento.status !== "ENVIADO") return false;
  if (!orcamento.validoAte) return false;
  return isBefore(orcamento.validoAte, hoje);
}

/** O único contrato que a Agenda consome. Ela nunca implementa esta lógica — só pergunta. */
export function orcamentoAceito(orcamento: OrcamentoData, hoje = new Date()): boolean {
  return orcamento.status === "APROVADO";
}

/**
 * QuoteReadyForScheduling — a Specification que a Agenda de fato consulta antes de
 * permitir agendar a partir de uma Consulta. Combina aceite com o estado de
 * expiração (um orçamento aprovado nunca expira mais — decisão do MVP, seção 2 da
 * modelagem), deixando a Agenda sem nenhuma lógica própria sobre isso.
 */
export function prontoParaAgendamento(orcamento: OrcamentoData, hoje = new Date()): boolean {
  return orcamentoAceito(orcamento, hoje);
}

/** Regra de negócio 2 da modelagem: só sai de RASCUNHO/ENVIADO nas transições certas. */
export function podeSerAprovadoOuRecusado(orcamento: OrcamentoData, hoje = new Date()): { pode: boolean; motivo?: string } {
  if (orcamento.status !== "ENVIADO") {
    return { pode: false, motivo: "Só um orçamento enviado pode ser aprovado ou recusado" };
  }
  if (orcamentoExpirado(orcamento, hoje)) {
    return { pode: false, motivo: "Este orçamento expirou — crie um novo" };
  }
  return { pode: true };
}

import { isBefore } from "date-fns";

/**
 * Specifications do Financeiro. Nenhuma delas persiste nada — todas leem
 * `Transaction`s (fatos imutáveis) e `Appointment.priceCentsSnapshot` (Financial
 * Source of Truth: o Financeiro nunca recalcula o preço, só o que aconteceu com ele).
 */

export interface TransactionFact {
  id: string;
  type: "INCOME" | "EXPENSE";
  amountCents: number;
  appointmentId: string | null;
  reversalOfId: string | null;
}

/**
 * CORREÇÃO ADL-103 (Operational Hardening Audit): esta função somava todo
 * INCOME sem excluir reversões, divergindo da lógica de `apurarComissoesDoPeriodo`
 * (Sprint 2), que já excluía corretamente. Agora as duas usam a mesma regra —
 * `transacaoLiquida()` extraída como a única fonte de verdade de "isto conta
 * como recebido líquido", nunca mais duplicada.
 */
function transacaoLiquida(t: TransactionFact, transactions: TransactionFact[]): boolean {
  if (t.type !== "INCOME") return false;
  if (t.reversalOfId) return false; // uma reversão em si nunca conta como recebimento
  const foiEstornada = transactions.some((r) => r.reversalOfId === t.id);
  return !foiEstornada;
}

/** Soma líquida de recebimentos de um Appointment — exclui transações já estornadas (correção ADL-103). */
export function totalRecebidoDoAppointment(appointmentId: string, transactions: TransactionFact[]): number {
  return transactions
    .filter((t) => t.appointmentId === appointmentId && transacaoLiquida(t, transactions))
    .reduce((sum, t) => sum + t.amountCents, 0);
}

/** Derived Over Stored: saldo devedor nunca é coluna, sempre esta diferença. */
export function saldoDevedor(priceCentsSnapshot: number, appointmentId: string, transactions: TransactionFact[]): number {
  return Math.max(0, priceCentsSnapshot - totalRecebidoDoAppointment(appointmentId, transactions));
}

/** Inadimplência é leitura, não estado armazenado. */
export function estaInadimplente(
  appointment: { id: string; priceCentsSnapshot: number; endAt: Date; status: string },
  transactions: TransactionFact[],
  hoje = new Date()
): boolean {
  if (appointment.status !== "DONE") return false;
  return saldoDevedor(appointment.priceCentsSnapshot, appointment.id, transactions) > 0 && isBefore(appointment.endAt, hoje);
}

/** Saldo de caixa de um período — soma líquida (INCOME positivo, EXPENSE negativo), nunca agregado armazenado. */
export function saldoCaixa(transactions: { type: "INCOME" | "EXPENSE"; amountCents: number }[]): number {
  return transactions.reduce((sum, t) => sum + (t.type === "INCOME" ? t.amountCents : -t.amountCents), 0);
}

/** Comissão devida — derivada até o pagamento (CommissionPayout fica para o Sprint 2, fora de escopo aqui). */
export function comissaoDevida(priceCentsSnapshot: number, commissionRatePercent: number): number {
  return Math.round(priceCentsSnapshot * (commissionRatePercent / 100));
}

/** Desconto concedido num recebimento — diferença aritmética, nunca editado no Quote/Appointment. */
export function descontoConcedido(priceCentsSnapshot: number, amountRecebidoCents: number): number {
  return Math.max(0, priceCentsSnapshot - amountRecebidoCents);
}

// ============================================================
// SPRINT 2 — Commission Trigger Policy, CommissionPayout, CashClosing
// ============================================================

export type CommissionTriggerPolicy = "ON_PAYMENT" | "ON_COMPLETION";

export interface ApuracaoAppointment {
  id: string;
  status: string;
  priceCentsSnapshot: number;
  professionalId: string;
}

export interface ApuracaoItem {
  appointmentId: string;
  transactionId: string;
  baseAmountCents: number;
  commissionAmountCents: number;
}

/**
 * Commission Trigger Policy (cap. 46) — parâmetro de entrada, nunca ramificação
 * espalhada. ON_PAYMENT (implementado): soma o recebido líquido por atendimento
 * (reutiliza `totalRecebidoDoAppointment`, já existente — Platform Discovery).
 * ON_COMPLETION: reservado, lançaria erro explícito se chamado — nenhuma
 * implementação parcial silenciosa.
 */
export function apurarComissoesDoPeriodo(
  policy: CommissionTriggerPolicy,
  appointments: ApuracaoAppointment[],
  transactions: TransactionFact[],
  commissionRatePercent: number
): ApuracaoItem[] {
  if (policy === "ON_COMPLETION") {
    throw new Error("Commission Trigger Policy ON_COMPLETION ainda não implementada — reservada para versão futura, sem refatoração estrutural necessária quando chegar a hora.");
  }

  const items: ApuracaoItem[] = [];
  for (const appt of appointments) {
    if (appt.status !== "DONE") continue;
    const recebidas = transactions.filter((t) => t.appointmentId === appt.id && transacaoLiquida(t, transactions));
    for (const t of recebidas) {
      items.push({
        appointmentId: appt.id,
        transactionId: t.id,
        baseAmountCents: t.amountCents,
        commissionAmountCents: comissaoDevida(t.amountCents, commissionRatePercent),
      });
    }
  }
  return items;
}

/** Derived Over Stored: total do payout é sempre a soma dos items, nunca campo próprio (mesmo padrão de Orcamento.valorTotal). */
export function totalPayout(items: ApuracaoItem[]): number {
  return items.reduce((sum, i) => sum + i.commissionAmountCents, 0);
}

/** Fechamento de caixa — differenceCents sempre derivado, nunca armazenado. */
export function diferencaFechamentoCaixa(expectedCentsSnapshot: number, countedCents: number): number {
  return countedCents - expectedCentsSnapshot;
}

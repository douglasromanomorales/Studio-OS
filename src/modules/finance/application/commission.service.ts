import { tenantDb } from "@/lib/db/tenant";
import { prisma } from "@/lib/db/client";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { NotFoundError, BusinessError } from "@/lib/errors";
import {
  apurarComissoesDoPeriodo,
  totalPayout,
  diferencaFechamentoCaixa,
  saldoCaixa,
  type TransactionFact,
  type ApuracaoAppointment,
  type CommissionTriggerPolicy,
} from "@/modules/finance/domain/specifications";
import type { AuthContext } from "@/lib/auth/require-auth";

export interface ApuracaoPreview {
  items: { appointmentId: string; transactionId: string; baseAmountCents: number; commissionAmountCents: number }[];
  totalCents: number;
}

/**
 * ⚠️ ADL-103/ADL-111 — Bug 3 permanece não corrigido nesta rodada, deliberadamente.
 * `commissionRate` é lido como a taxa ATUAL da profissional; se a taxa mudar entre
 * o atendimento e a apuração, o período inteiro é recalculado com a taxa nova.
 * A correção estrutural exige uma entidade de histórico de taxa — modelagem de
 * domínio nova, fora do escopo de autonomia operacional sem Domain Pipeline.
 */
export async function apurarComissaoDoProfissional(
  ctx: AuthContext,
  professionalId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<ApuracaoPreview> {
  const db = tenantDb(ctx.organizationId);

  const professional = await db.professional.findUnique({ where: { id: professionalId } });
  if (!professional) throw new NotFoundError("Profissional");

  const appointmentsRaw = await db.appointment.findMany({
    where: { professionalId, status: "DONE", startAt: { gte: periodStart, lte: periodEnd } },
    include: { transactions: true },
  });

  const appointments: ApuracaoAppointment[] = appointmentsRaw.map((a) => ({
    id: a.id, status: a.status, priceCentsSnapshot: a.priceCentsSnapshot, professionalId: a.professionalId,
  }));
  const transactions: TransactionFact[] = appointmentsRaw.flatMap((a) =>
    a.transactions.map((t) => ({ id: t.id, type: t.type, amountCents: t.amountCents, appointmentId: t.appointmentId, reversalOfId: t.reversalOfId }))
  );

  const policy: CommissionTriggerPolicy = "ON_PAYMENT"; // Organization.commissionTriggerPolicy — default do schema
  const items = apurarComissoesDoPeriodo(policy, appointments, transactions, Number(professional.commissionRate));
  return { items, totalCents: totalPayout(items) };
}

/**
 * Immutable Financial Ledger: cria CommissionPayout + CommissionPayoutItem numa
 * única transação (Payout Snapshot Principle — os 7 campos mínimos). Nunca edita
 * um payout existente.
 */
export async function pagarComissao(
  ctx: AuthContext,
  professionalId: string,
  periodStart: Date,
  periodEnd: Date,
  method: "PIX" | "CARD_CREDIT" | "CARD_DEBIT" | "CASH" | "TRANSFER"
) {
  const preview = await apurarComissaoDoProfissional(ctx, professionalId, periodStart, periodEnd);
  if (preview.items.length === 0) throw new BusinessError("Nenhuma comissão a pagar neste período");

  const professional = await tenantDb(ctx.organizationId).professional.findUnique({ where: { id: professionalId } });
  if (!professional) throw new NotFoundError("Profissional");

  const payout = await prisma.$transaction(async (tx) => {
    const scopedDb = tenantDb(ctx.organizationId, tx);
    const created = await scopedDb.commissionPayout.create({
      data: { organizationId: ctx.organizationId, professionalId, periodStart, periodEnd, method },
    });
    await tx.commissionPayoutItem.createMany({
      data: preview.items.map((item) => ({
        payoutId: created.id,
        appointmentId: item.appointmentId,
        professionalId,
        transactionId: item.transactionId,
        commissionRateSnapshot: professional.commissionRate,
        baseAmountSnapshot: item.baseAmountCents,
        commissionAmountSnapshot: item.commissionAmountCents,
      })),
    });
    return created;
  });

  await writeAuditLog(ctx, { action: "financeiro.comissao_paga", entityType: "CommissionPayout", entityId: payout.id, payload: { professionalId, totalCents: preview.totalCents } });
  return { ok: true as const, id: payout.id, totalCents: preview.totalCents };
}

/** Correção de payout já pago — novo CommissionPayout negativo com adjustsPayoutId, nunca edição. */
export async function ajustarComissaoPaga(ctx: AuthContext, payoutOriginalId: string, motivo: string) {
  const db = tenantDb(ctx.organizationId);
  const original = await db.commissionPayout.findUnique({ where: { id: payoutOriginalId }, include: { items: true } });
  if (!original) throw new NotFoundError("Pagamento de comissão");

  const totalOriginal = original.items.reduce((s, i) => s + i.commissionAmountSnapshot, 0);

  const adjustment = await prisma.$transaction(async (tx) => {
    const scopedDb = tenantDb(ctx.organizationId, tx);
    const created = await scopedDb.commissionPayout.create({
      data: { organizationId: ctx.organizationId, professionalId: original.professionalId, periodStart: original.periodStart, periodEnd: original.periodEnd, adjustsPayoutId: original.id },
    });
    await tx.commissionPayoutItem.createMany({
      data: original.items.map((item) => ({
        payoutId: created.id,
        appointmentId: item.appointmentId,
        professionalId: item.professionalId,
        transactionId: item.transactionId,
        commissionRateSnapshot: item.commissionRateSnapshot,
        baseAmountSnapshot: -item.baseAmountSnapshot,
        commissionAmountSnapshot: -item.commissionAmountSnapshot,
      })),
    });
    return created;
  });

  await writeAuditLog(ctx, { action: "financeiro.comissao_ajustada", entityType: "CommissionPayout", entityId: adjustment.id, payload: { adjustsPayoutId: payoutOriginalId, valorAjusteCents: -totalOriginal, motivo } });
  return { ok: true as const, id: adjustment.id };
}

export interface CommissionPayoutHistoryItem {
  id: string;
  professionalName: string;
  periodStart: Date;
  periodEnd: Date;
  totalCents: number;
  paidAt: Date;
  isAdjustment: boolean;
}

export async function listarHistoricoComissoes(ctx: AuthContext): Promise<CommissionPayoutHistoryItem[]> {
  const db = tenantDb(ctx.organizationId);
  const payouts = await db.commissionPayout.findMany({
    include: { professional: true, items: true },
    orderBy: { paidAt: "desc" },
  });
  return payouts.map((p) => ({
    id: p.id,
    professionalName: p.professional.name,
    periodStart: p.periodStart,
    periodEnd: p.periodEnd,
    totalCents: p.items.reduce((s, i) => s + i.commissionAmountSnapshot, 0),
    paidAt: p.paidAt,
    isAdjustment: p.adjustsPayoutId !== null,
  }));
}

/** Fechamento de caixa — expectedCentsSnapshot congelado no momento do fechamento, nunca recalculado depois. */
export async function fecharCaixa(ctx: AuthContext, dia: Date, countedCents: number, closedByMembershipId: string) {
  const db = tenantDb(ctx.organizationId);
  const start = new Date(dia); start.setHours(0, 0, 0, 0);
  const end = new Date(dia); end.setHours(23, 59, 59, 999);

  const transactionsDoDia = await db.transaction.findMany({ where: { date: { gte: start, lte: end } } });
  const expectedCentsSnapshot = saldoCaixa(transactionsDoDia);
  const differenceCents = diferencaFechamentoCaixa(expectedCentsSnapshot, countedCents);

  const closing = await db.cashClosing.create({
    data: { organizationId: ctx.organizationId, date: dia, expectedCentsSnapshot, countedCents, closedByMembershipId },
  });

  await writeAuditLog(ctx, { action: "financeiro.caixa_fechado", entityType: "CashClosing", entityId: closing.id, payload: { expectedCentsSnapshot, countedCents, differenceCents } });
  return { ok: true as const, id: closing.id, expectedCentsSnapshot, differenceCents };
}

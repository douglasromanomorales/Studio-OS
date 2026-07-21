import { z } from "zod";
import { tenantDb } from "@/lib/db/tenant";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { ValidationError, NotFoundError } from "@/lib/errors";
import { estaInadimplente, type TransactionFact } from "@/modules/finance/domain/specifications";
import type { AuthContext } from "@/lib/auth/require-auth";

const registrarRecebimentoSchema = z.object({
  appointmentId: z.string().optional(),
  categoryId: z.string().min(1),
  amountCents: z.number().int().positive(),
  method: z.enum(["PIX", "CARD_CREDIT", "CARD_DEBIT", "CASH", "TRANSFER"]),
  descriptionSnapshot: z.string().min(1),
});
export type RegistrarRecebimentoValues = z.infer<typeof registrarRecebimentoSchema>;

/** Immutable Financial Ledger: só INSERT. Correção é sempre um novo registro (ver registrarEstorno). */
export async function registrarRecebimento(ctx: AuthContext, values: RegistrarRecebimentoValues) {
  const parsed = registrarRecebimentoSchema.safeParse(values);
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0].message);

  const db = tenantDb(ctx.organizationId);
  const created = await db.transaction.create({
    data: {
      type: "INCOME",
      amountCents: parsed.data.amountCents,
      method: parsed.data.method,
      categoryId: parsed.data.categoryId,
      appointmentId: parsed.data.appointmentId,
      descriptionSnapshot: parsed.data.descriptionSnapshot,
    },
  });

  await writeAuditLog(ctx, { action: "financeiro.recebimento_registrado", entityType: "Transaction", entityId: created.id, payload: { amountCents: parsed.data.amountCents } });
  return { ok: true as const, id: created.id };
}

/** Estorno = nova Transaction com reversalOfId, nunca edição da original (ADL-103, Bug 2 corrigido: appointmentId propagado). */
export async function registrarEstorno(ctx: AuthContext, transacaoOriginalId: string) {
  const db = tenantDb(ctx.organizationId);
  const original = await db.transaction.findUnique({ where: { id: transacaoOriginalId } });
  if (!original) throw new NotFoundError("Transação");

  const created = await db.transaction.create({
    data: {
      type: "EXPENSE",
      amountCents: original.amountCents,
      categoryId: original.categoryId,
      appointmentId: original.appointmentId,
      reversalOfId: original.id,
      descriptionSnapshot: `Estorno — ${original.descriptionSnapshot}`,
    },
  });

  await writeAuditLog(ctx, { action: "financeiro.estorno_registrado", entityType: "Transaction", entityId: created.id, payload: { reversalOfId: original.id }, correlationId: original.id });
  return { ok: true as const, id: created.id };
}

export interface TransactionListItem {
  id: string;
  type: "INCOME" | "EXPENSE";
  amountCents: number;
  method: "PIX" | "CARD_CREDIT" | "CARD_DEBIT" | "CASH" | "TRANSFER" | null;
  categoryName: string;
  descriptionSnapshot: string;
  appointmentId: string | null;
  reversalOfId: string | null;
  date: Date;
}

export async function listarTransacoesDoDia(ctx: AuthContext, dia: Date): Promise<TransactionListItem[]> {
  const db = tenantDb(ctx.organizationId);
  const start = new Date(dia); start.setHours(0, 0, 0, 0);
  const end = new Date(dia); end.setHours(23, 59, 59, 999);

  const transactions = await db.transaction.findMany({
    where: { date: { gte: start, lte: end } },
    include: { category: true },
    orderBy: { date: "desc" },
  });

  return transactions.map((t) => ({
    id: t.id,
    type: t.type,
    amountCents: t.amountCents,
    method: t.method,
    categoryName: t.category.name,
    descriptionSnapshot: t.descriptionSnapshot,
    appointmentId: t.appointmentId,
    reversalOfId: t.reversalOfId,
    date: t.date,
  }));
}

export interface PendenciaItem {
  appointmentId: string;
  customerName: string;
  serviceName: string;
  priceCentsSnapshot: number;
  saldoDevedorCents: number;
  endAt: Date;
}

/**
 * ACHADO DA AUDITORIA (Operational Hardening, seção 2) unificado nesta correção:
 * antes, `listarPendencias` usava só `saldoDevedor > 0` (sem checar prazo),
 * enquanto `estaInadimplente` (não usada aqui) checava prazo vencido — dois
 * critérios de "problema" coexistindo sem unificação. Agora só `estaInadimplente`
 * decide o que aparece na lista — uma fonte de verdade, não duas.
 */
export async function listarPendencias(ctx: AuthContext): Promise<PendenciaItem[]> {
  const db = tenantDb(ctx.organizationId);
  const appointments = await db.appointment.findMany({
    where: { status: "DONE" },
    include: { customer: true, service: true, transactions: true },
  });

  const result: PendenciaItem[] = [];
  for (const a of appointments) {
    const transactions: TransactionFact[] = a.transactions.map((t) => ({
      id: t.id, type: t.type, amountCents: t.amountCents, appointmentId: t.appointmentId, reversalOfId: t.reversalOfId,
    }));
    if (!estaInadimplente({ id: a.id, priceCentsSnapshot: a.priceCentsSnapshot, endAt: a.endAt, status: a.status }, transactions)) continue;

    const recebido = transactions.filter((t) => t.type === "INCOME" && !t.reversalOfId).reduce((s, t) => s + t.amountCents, 0);
    result.push({
      appointmentId: a.id,
      customerName: a.customer.name,
      serviceName: a.service?.name ?? "Orçamento",
      priceCentsSnapshot: a.priceCentsSnapshot,
      saldoDevedorCents: a.priceCentsSnapshot - recebido,
      endAt: a.endAt,
    });
  }
  return result;
}

export async function listarCategorias(ctx: AuthContext) {
  const db = tenantDb(ctx.organizationId);
  return db.transactionCategory.findMany({ orderBy: { name: "asc" } });
}

import { z } from "zod";
import { tenantDb } from "@/lib/db/tenant";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { ValidationError, BusinessError, NotFoundError } from "@/lib/errors";
import { valorTotal, duracaoEstimada, podeSerAprovadoOuRecusado } from "@/modules/quotes/domain/specifications";
import type { AuthContext } from "@/lib/auth/require-auth";

const itemSchema = z.object({
  serviceId: z.string().min(1),
  serviceNameSnapshot: z.string().min(1),
  amountCents: z.number().int().positive(),
  durationMinutesSnapshot: z.number().int().positive(),
});
const criarOrcamentoSchema = z.object({
  consultaId: z.string().min(1),
  professionalId: z.string().min(1),
  items: z.array(itemSchema).min(1, "Adicione ao menos um item ao orçamento"),
  validoAte: z.date().optional(),
  observacoes: z.string().max(1000).optional(),
});
export type CriarOrcamentoValues = z.infer<typeof criarOrcamentoSchema>;

export async function criarOrcamento(ctx: AuthContext, values: CriarOrcamentoValues) {
  const parsed = criarOrcamentoSchema.safeParse(values);
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0].message);

  const db = tenantDb(ctx.organizationId);
  const consulta = await db.consulta.findUnique({ where: { id: parsed.data.consultaId } });
  if (!consulta) throw new NotFoundError("Consulta");
  // Regra de negócio 1 da modelagem: só nasce de Consulta AVALIADA.
  if (consulta.status !== "AVALIADA") throw new BusinessError("Consulta precisa estar avaliada antes de gerar um orçamento");

  // Regra 4 da modelagem: no máximo um orçamento ativo (RASCUNHO/ENVIADO) por Consulta.
  const ativo = await db.orcamento.findFirst({ where: { consultaId: parsed.data.consultaId, status: { in: ["RASCUNHO", "ENVIADO"] } } });
  if (ativo) throw new BusinessError("Já existe um orçamento ativo para esta consulta");

  const created = await db.orcamento.create({
    data: {
      consultaId: parsed.data.consultaId,
      professionalId: parsed.data.professionalId,
      validoAte: parsed.data.validoAte,
      observacoes: parsed.data.observacoes,
      items: { create: parsed.data.items },
    },
    include: { items: true },
  });

  const total = valorTotal(created.items);
  const duracao = duracaoEstimada(created.items);
  await writeAuditLog(ctx, { action: "orcamento.criado", entityType: "Orcamento", entityId: created.id, payload: { consultaId: parsed.data.consultaId, total, duracao } });
  return { id: created.id, total, duracao };
}

export async function enviarOrcamento(ctx: AuthContext, orcamentoId: string) {
  const db = tenantDb(ctx.organizationId);
  const orcamento = await db.orcamento.findUnique({ where: { id: orcamentoId } });
  if (!orcamento) throw new NotFoundError("Orçamento");
  if (orcamento.status !== "RASCUNHO") throw new BusinessError("Só um orçamento em rascunho pode ser enviado");

  await db.orcamento.update({ where: { id: orcamentoId }, data: { status: "ENVIADO" } });
  await writeAuditLog(ctx, { action: "orcamento.enviado", entityType: "Orcamento", entityId: orcamentoId, payload: {} });
  return { ok: true as const };
}

export async function aprovarOrcamento(ctx: AuthContext, orcamentoId: string) {
  const db = tenantDb(ctx.organizationId);
  const orcamento = await db.orcamento.findUnique({ where: { id: orcamentoId } });
  if (!orcamento) throw new NotFoundError("Orçamento");

  const check = podeSerAprovadoOuRecusado({ status: orcamento.status, validoAte: orcamento.validoAte });
  if (!check.pode) throw new BusinessError(check.motivo!);

  await db.orcamento.update({ where: { id: orcamentoId }, data: { status: "APROVADO" } });
  // QuoteAccepted — ponto de integração para Dashboard/Agenda/Financeiro/Notificações (modelagem original).
  await writeAuditLog(ctx, { action: "orcamento.aceito", entityType: "Orcamento", entityId: orcamentoId, payload: {} });
  return { ok: true as const };
}

export async function recusarOrcamento(ctx: AuthContext, orcamentoId: string) {
  const db = tenantDb(ctx.organizationId);
  const orcamento = await db.orcamento.findUnique({ where: { id: orcamentoId } });
  if (!orcamento) throw new NotFoundError("Orçamento");

  const check = podeSerAprovadoOuRecusado({ status: orcamento.status, validoAte: orcamento.validoAte });
  if (!check.pode) throw new BusinessError(check.motivo!);

  await db.orcamento.update({ where: { id: orcamentoId }, data: { status: "RECUSADO" } });
  await writeAuditLog(ctx, { action: "orcamento.recusado", entityType: "Orcamento", entityId: orcamentoId, payload: {} });
  return { ok: true as const };
}

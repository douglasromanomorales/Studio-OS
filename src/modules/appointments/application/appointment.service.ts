import { prisma } from "@/lib/db/client";
import { tenantDb } from "@/lib/db/tenant";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { BusinessError, ConflictError, NotFoundError } from "@/lib/errors";
import { haColisaoDeHorario, podeCancelar, type AppointmentInterval } from "@/modules/appointments/domain/specifications";
import { prontoParaAgendamento } from "@/modules/quotes/domain/specifications";
import { requiresConsultation, servicoDisponivel } from "@/modules/services/domain/specifications";
import { resolvePriceStrategy } from "@/modules/services/domain/value-objects";
import { podeExecutarServico, profissionalAtiva, estaDeFeriasOuLicenca } from "@/modules/professionals/domain/specifications";
import type { AuthContext } from "@/lib/auth/require-auth";

export interface CriarAppointmentInput {
  customerId: string;
  professionalId: string;
  serviceId?: string;
  quoteId?: string;
  startAt: Date;
  origin: "ADMIN" | "PORTAL" | "WHATSAPP" | "AI";
}

/**
 * A sequência é literalmente a seção 2 do Agenda Orchestration Blueprint — cada
 * checagem chama a Specification do domínio dono. Este Application Service NÃO
 * decide nada sozinho, exceto o passo 9 (colisão) — a única regra própria da Agenda.
 */
export async function criarAppointment(ctx: AuthContext, input: CriarAppointmentInput, client?: Parameters<typeof tenantDb>[1]) {
  const db = tenantDb(ctx.organizationId, client);

  const [service, quote, customer, professional] = await Promise.all([
    input.serviceId ? db.service.findUnique({ where: { id: input.serviceId } }) : null,
    input.quoteId ? db.orcamento.findUnique({ where: { id: input.quoteId }, include: { items: true } }) : null,
    db.customer.findUnique({ where: { id: input.customerId } }),
    db.professional.findUnique({ where: { id: input.professionalId }, include: { credentials: true, scheduleBlocks: true } }),
  ]);

  if (!customer) throw new NotFoundError("Cliente");
  if (!professional) throw new NotFoundError("Profissional");

  // 1. Serviço disponível
  if (service && !servicoDisponivel(service.discontinuedAt)) throw new BusinessError("Serviço descontinuado");

  // 2. Precisa de Quote?
  if (service) {
    const strategy = resolvePriceStrategy(service.pricingMode, service.price ? Number(service.price) : null);
    if (requiresConsultation(strategy) && !quote) throw new BusinessError("Este serviço exige orçamento aprovado antes de agendar");
  }
  if (quote && !prontoParaAgendamento({ status: quote.status, validoAte: quote.validoAte })) {
    throw new BusinessError("Orçamento ainda não foi aceito");
  }

  // 3. Teste de mechas
  if (service?.requiresStrandTest) {
    const validTest = await db.strandTestRecord.findFirst({
      where: { customerId: input.customerId, OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }] },
    });
    if (!validTest) throw new BusinessError("Cliente precisa do Teste de Mechas antes deste serviço");
  }

  // 4. Cliente visível
  if (customer.archivedAt) throw new BusinessError("Cliente arquivado");

  // 5. Profissional ativa
  if (!profissionalAtiva(professional.terminatedAt)) throw new BusinessError("Profissional desligada");

  // 6. Bloqueio de agenda + duração
  const durationMinutesSnapshot =
    service?.durationMinutes ??
    (quote ? quote.items.reduce((sum, i) => sum + i.durationMinutesSnapshot, 0) : 60);
  const endAt = new Date(input.startAt.getTime() + durationMinutesSnapshot * 60000);
  if (estaDeFeriasOuLicenca(professional.scheduleBlocks, input.startAt)) {
    throw new BusinessError("Profissional está de férias/licença nesse período");
  }

  // 7. Capacidade
  if (service?.requiresCredential && !podeExecutarServico(professional.credentials, { requiresCredential: service.requiresCredential })) {
    throw new BusinessError(`Profissional não tem a credencial exigida: ${service.requiresCredential}`);
  }

  // 8. Preço efetivo — Snapshot Eligibility
  const priceCentsSnapshot = quote
    ? quote.items.reduce((sum, i) => sum + i.amountCents, 0)
    : service
      ? resolvePriceStrategyToCents(service.pricingMode, service.price ? Number(service.price) : null)
      : 0;

  // 9. ÚNICA REGRA PRÓPRIA DA AGENDA: colisão de horário
  const existentesRaw = await db.appointment.findMany({
    where: { professionalId: input.professionalId, status: { not: "CANCELED" } },
  });
  const existentes: AppointmentInterval[] = existentesRaw.map((a) => ({ id: a.id, professionalId: a.professionalId, startAt: a.startAt, endAt: a.endAt, status: a.status }));
  if (haColisaoDeHorario({ professionalId: input.professionalId, startAt: input.startAt, endAt }, existentes)) {
    throw new ConflictError("Já existe um agendamento nesse horário para esta profissional");
  }

  // 10. Criar
  const created = await db.appointment.create({
    data: {
      customerId: input.customerId,
      professionalId: input.professionalId,
      serviceId: input.serviceId,
      quoteId: input.quoteId,
      startAt: input.startAt,
      endAt,
      origin: input.origin,
      durationMinutesSnapshot,
      priceCentsSnapshot,
    },
  });

  await writeAuditLog(ctx, { action: "appointment.criado", entityType: "Appointment", entityId: created.id, payload: { customerId: input.customerId, professionalId: input.professionalId } });
  return { id: created.id, startAt: created.startAt, endAt: created.endAt };
}

export async function confirmarAppointment(ctx: AuthContext, appointmentId: string) {
  const db = tenantDb(ctx.organizationId);
  const appt = await db.appointment.findUnique({ where: { id: appointmentId } });
  if (!appt) throw new NotFoundError("Appointment");

  await db.appointment.update({ where: { id: appointmentId }, data: { status: "CONFIRMED" } });
  await writeAuditLog(ctx, { action: "appointment.confirmado", entityType: "Appointment", entityId: appointmentId, payload: {} });
  return { ok: true as const };
}

export async function cancelarAppointment(
  ctx: AuthContext,
  appointmentId: string,
  reason: "CLIENT_REQUEST" | "RESCHEDULED" | "PROFESSIONAL_UNAVAILABLE" | "OTHER",
  correlationId?: string
) {
  const db = tenantDb(ctx.organizationId);
  const appt = await db.appointment.findUnique({ where: { id: appointmentId } });
  if (!appt) throw new NotFoundError("Appointment");
  if (!podeCancelar(appt.status)) throw new BusinessError("Este agendamento não pode mais ser cancelado");

  await db.appointment.update({ where: { id: appointmentId }, data: { status: "CANCELED", cancelReason: reason, correlationId } });
  await writeAuditLog(ctx, { action: "appointment.cancelado", entityType: "Appointment", entityId: appointmentId, payload: { reason }, correlationId });
  return { ok: true as const };
}

export async function ajustarDuracaoAppointment(ctx: AuthContext, appointmentId: string, novaDuracaoMin: number) {
  const db = tenantDb(ctx.organizationId);
  const appt = await db.appointment.findUnique({ where: { id: appointmentId } });
  if (!appt) throw new NotFoundError("Appointment");

  const novoEndAt = new Date(appt.startAt.getTime() + novaDuracaoMin * 60000);
  const outrosRaw = await db.appointment.findMany({ where: { professionalId: appt.professionalId, status: { not: "CANCELED" } } });
  const outros: AppointmentInterval[] = outrosRaw.map((a) => ({ id: a.id, professionalId: a.professionalId, startAt: a.startAt, endAt: a.endAt, status: a.status }));

  if (haColisaoDeHorario({ professionalId: appt.professionalId, startAt: appt.startAt, endAt: novoEndAt, excludeId: appointmentId }, outros)) {
    throw new ConflictError("Nova duração colide com outro agendamento");
  }

  await db.appointment.update({ where: { id: appointmentId }, data: { endAt: novoEndAt, durationMinutesSnapshot: novaDuracaoMin } });
  await writeAuditLog(ctx, { action: "appointment.duracao_ajustada", entityType: "Appointment", entityId: appointmentId, payload: { novaDuracaoMin } });
  return { ok: true as const, endAt: novoEndAt };
}

/**
 * remarcar = cancelarAppointment(RESCHEDULED) + criarAppointment, correlacionados,
 * dentro de $transaction (ITS, seção 1 — resolve o TODO de rollback que a versão
 * mockada deixava explícito: se a criação do novo horário falhar, o cancelamento
 * do original é revertido junto, nunca fica um estado parcial).
 */
export async function remarcarAppointment(ctx: AuthContext, appointmentId: string, novoStartAt: Date) {
  const correlationId = `resched-${appointmentId}-${Date.now()}`;

  return prisma.$transaction(async (tx) => {
    const scopedDb = tenantDb(ctx.organizationId, tx);
    const appt = await scopedDb.appointment.findUnique({ where: { id: appointmentId } });
    if (!appt) throw new NotFoundError("Appointment");
    if (!podeCancelar(appt.status)) throw new BusinessError("Este agendamento não pode mais ser cancelado");

    await scopedDb.appointment.update({ where: { id: appointmentId }, data: { status: "CANCELED", cancelReason: "RESCHEDULED", correlationId } });

    const novo = await criarAppointment(ctx, {
      customerId: appt.customerId,
      professionalId: appt.professionalId,
      serviceId: appt.serviceId ?? undefined,
      quoteId: appt.quoteId ?? undefined,
      startAt: novoStartAt,
      origin: appt.origin,
    }, tx);

    await writeAuditLog(ctx, { action: "appointment.remarcado_via_correlacao", entityType: "Appointment", entityId: novo.id, payload: { de: appointmentId, para: novo.id }, correlationId });
    return { id: novo.id, correlationId };
  });
}

export interface AppointmentListItem {
  id: string;
  customerName: string;
  professionalId: string;
  professionalName: string;
  professionalColor: string;
  serviceName: string;
  startAt: Date;
  endAt: Date;
  status: "SCHEDULED" | "CONFIRMED" | "DONE" | "NO_SHOW" | "CANCELED";
}

export async function listarAppointmentsDoDia(ctx: AuthContext, dia: Date): Promise<AppointmentListItem[]> {
  const db = tenantDb(ctx.organizationId);
  const start = new Date(dia); start.setHours(0, 0, 0, 0);
  const end = new Date(dia); end.setHours(23, 59, 59, 999);

  const appointments = await db.appointment.findMany({
    where: { startAt: { gte: start, lte: end } },
    include: { customer: true, professional: true, service: true },
    orderBy: { startAt: "asc" },
  });

  return appointments.map((a) => ({
    id: a.id,
    customerName: a.customer.name,
    professionalId: a.professionalId,
    professionalName: a.professional.name,
    professionalColor: a.professional.color,
    serviceName: a.service?.name ?? "Orçamento",
    startAt: a.startAt,
    endAt: a.endAt,
    status: a.status,
  }));
}

export async function listarProfissionaisDaGrade(ctx: AuthContext) {
  const db = tenantDb(ctx.organizationId);
  const professionals = await db.professional.findMany({ where: { terminatedAt: null }, orderBy: { name: "asc" } });
  return professionals.map((p) => ({ id: p.id, name: p.name, color: p.color }));
}

function resolvePriceStrategyToCents(pricingMode: "FIXED" | "QUOTE_REQUIRED", price: number | null): number {
  const strategy = resolvePriceStrategy(pricingMode, price);
  return strategy.mode === "FIXED" ? strategy.amountCents : 0;
}

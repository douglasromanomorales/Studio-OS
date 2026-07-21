import { tenantDb } from "@/lib/db/tenant";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { NotFoundError, ConflictError } from "@/lib/errors";
import { normalizarTelefone } from "@/modules/customers/domain/value-objects";
import { consultaSchema, type ConsultaFormValues } from "@/lib/validations/consulta";
import { ValidationError } from "@/lib/errors";
import type { AuthContext } from "@/lib/auth/require-auth";

export async function searchCustomers(ctx: AuthContext, query: string) {
  const db = tenantDb(ctx.organizationId);
  const q = query.trim();
  return db.customer.findMany({
    where: {
      archivedAt: null,
      ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { phone: { contains: q.replace(/\D/g, "") } }] } : {}),
    },
    take: 10,
    orderBy: { name: "asc" },
  });
}

export async function createConsulta(ctx: AuthContext, values: ConsultaFormValues & { precisaTesteMechas: boolean }) {
  const parsed = consultaSchema.safeParse(values);
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0].message);

  const db = tenantDb(ctx.organizationId);
  const customer = await db.customer.findUnique({ where: { id: parsed.data.customerId } });
  if (!customer) throw new NotFoundError("Cliente");

  const created = await db.consulta.create({
    data: {
      customerId: parsed.data.customerId,
      origin: parsed.data.origin,
      jaFezQuimica: parsed.data.jaFezQuimica,
      tipoUltimoProcedimento: parsed.data.tipoUltimoProcedimento,
      dataUltimoProcedimento: parsed.data.dataUltimoProcedimento,
      alergiaConhecida: parsed.data.alergiaConhecida,
      observacoesHistorico: parsed.data.observacoesHistorico,
      objetivoCliente: parsed.data.objetivoCliente,
      precisaTesteMechas: values.precisaTesteMechas,
      photos: { create: parsed.data.photoUrls.map((url) => ({ type: "ATUAL" as const, storagePath: url })) },
      interestedServices: { create: parsed.data.interestedServiceIds.map((serviceId) => ({ serviceId })) },
    },
  });

  await writeAuditLog(ctx, { action: "consulta.criada", entityType: "Consulta", entityId: created.id, payload: { customerId: parsed.data.customerId } });
  return { id: created.id };
}

export async function createCustomerQuick(ctx: AuthContext, data: { name: string; phone: string }) {
  const phone = normalizarTelefone(data.phone);
  if (!phone) throw new ValidationError("Telefone inválido");

  const db = tenantDb(ctx.organizationId);
  const existing = await db.customer.findFirst({ where: { phone } });
  if (existing) throw new ConflictError("Já existe um cliente com este telefone");

  const created = await db.customer.create({ data: { name: data.name, phone } });
  await writeAuditLog(ctx, { action: "cliente.cadastrado", entityType: "Customer", entityId: created.id, payload: { phone, origin: "quick_create_consulta" } });
  return { id: created.id, name: created.name, phone: created.phone };
}

export async function listConsultas(ctx: AuthContext) {
  const db = tenantDb(ctx.organizationId);
  return db.consulta.findMany({
    where: { status: { not: "ARQUIVADA" } },
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getConsulta(ctx: AuthContext, id: string) {
  const db = tenantDb(ctx.organizationId);
  const consulta = await db.consulta.findUnique({
    where: { id },
    include: { customer: true, photos: true, interestedServices: { include: { service: true } } },
  });
  if (!consulta) throw new NotFoundError("Consulta");
  return consulta;
}

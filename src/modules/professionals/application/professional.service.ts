import { z } from "zod";
import { tenantDb } from "@/lib/db/tenant";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { ValidationError, NotFoundError, ConflictError } from "@/lib/errors";
import { corAgendaPadrao, validarCorAgenda, validarComissao } from "@/modules/professionals/domain/value-objects";
import type { AuthContext } from "@/lib/auth/require-auth";

const profissionalSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório"),
  color: z.string().optional(),
  commissionRate: z.number().min(0).max(100).default(0),
});
export type ProfissionalFormValues = z.infer<typeof profissionalSchema>;

export async function cadastrarProfissional(ctx: AuthContext, values: ProfissionalFormValues) {
  const parsed = profissionalSchema.safeParse(values);
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0].message);

  const color = parsed.data.color ?? corAgendaPadrao(parsed.data.name);
  const corCheck = validarCorAgenda(color);
  if (!corCheck.valid) throw new ValidationError(corCheck.reason!);

  const comissaoCheck = validarComissao(parsed.data.commissionRate);
  if (!comissaoCheck.valid) throw new ValidationError(comissaoCheck.reason!);

  const db = tenantDb(ctx.organizationId);
  const created = await db.professional.create({
    data: { organizationId: ctx.organizationId, name: parsed.data.name, color, commissionRate: parsed.data.commissionRate },
  });

  await writeAuditLog(ctx, { action: "profissional.cadastrada", entityType: "Professional", entityId: created.id, payload: { name: parsed.data.name } });
  return { ok: true as const, id: created.id };
}

export async function registrarCredencial(
  ctx: AuthContext,
  professionalId: string,
  data: { name: string; registryNumber?: string; validUntil?: Date }
) {
  if (!data.name.trim()) throw new ValidationError("Nome da credencial é obrigatório");
  const db = tenantDb(ctx.organizationId);

  const professional = await db.professional.findUnique({ where: { id: professionalId } });
  if (!professional) throw new NotFoundError("Profissional");

  const existing = await db.professionalCredential.findFirst({ where: { professionalId, name: data.name } });
  if (existing) throw new ConflictError("Esta credencial já está cadastrada para esta profissional");

  const credential = await db.professionalCredential.create({
    data: { professionalId, name: data.name, registryNumber: data.registryNumber, validUntil: data.validUntil },
  });

  await writeAuditLog(ctx, { action: "profissional.credencial_registrada", entityType: "ProfessionalCredential", entityId: credential.id, payload: { professionalId, ...data } });
  return { ok: true as const };
}

export async function declararEspecialidade(ctx: AuthContext, professionalId: string, name: string, level?: string) {
  if (!name.trim()) throw new ValidationError("Nome da especialidade é obrigatório");
  const db = tenantDb(ctx.organizationId);

  const specialty = await db.professionalSpecialty.create({ data: { professionalId, name, level } });
  await writeAuditLog(ctx, { action: "profissional.especialidade_declarada", entityType: "ProfessionalSpecialty", entityId: specialty.id, payload: { professionalId, name, level } });
  return { ok: true as const };
}

/**
 * ⚠️ Dívida registrada (Operational Hardening Audit, seção 1/2): desligar uma
 * profissional não cascateia para Appointments futuros dela, que continuam
 * SCHEDULED silenciosamente. Corrigir isso é uma decisão de orquestração
 * (Agenda deveria reagir a este evento) — fora do escopo desta correção
 * pontual, registrado aqui para não ser esquecido, não implementado às pressas.
 */
export async function desligarProfissional(ctx: AuthContext, professionalId: string) {
  const db = tenantDb(ctx.organizationId);
  const professional = await db.professional.findUnique({ where: { id: professionalId } });
  if (!professional) throw new NotFoundError("Profissional");

  await db.professional.update({ where: { id: professionalId }, data: { terminatedAt: new Date() } });
  await writeAuditLog(ctx, { action: "profissional.desligada", entityType: "Professional", entityId: professionalId, payload: {} });
  return { ok: true as const };
}

export interface ProfissionalListItem {
  id: string;
  name: string;
  color: string;
  credentials: string[];
  specialties: string[];
}

export async function listarProfissionais(ctx: AuthContext): Promise<ProfissionalListItem[]> {
  const db = tenantDb(ctx.organizationId);
  const professionals = await db.professional.findMany({
    where: { terminatedAt: null }, // profissionalAtiva() aplicado de verdade
    include: { credentials: true, specialties: true },
    orderBy: { name: "asc" },
  });
  return professionals.map((p) => ({
    id: p.id,
    name: p.name,
    color: p.color,
    credentials: p.credentials.filter((c) => !c.validUntil || c.validUntil > new Date()).map((c) => c.name),
    specialties: p.specialties.map((s) => s.name),
  }));
}

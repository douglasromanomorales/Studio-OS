import { z } from "zod";
import { tenantDb } from "@/lib/db/tenant";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { ValidationError, ConflictError, NotFoundError } from "@/lib/errors";
import { normalizarTelefone, novoConsentimento } from "@/modules/customers/domain/value-objects";
import type { AuthContext } from "@/lib/auth/require-auth";

const clienteSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório"),
  phone: z.string().min(10, "Telefone é obrigatório"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  instagram: z.string().optional(),
  birthDate: z.date().optional(),
  notes: z.string().max(2000).optional(),
  consent: z.boolean(),
});
export type ClienteFormValues = z.infer<typeof clienteSchema>;

/**
 * Application Service real — substitui o mock. `organizationId` como primeiro
 * parâmetro (convenção inalterada desde sempre, ver ADL-110); quem preenche esse
 * valor agora é `requireAuth()`, nunca o cliente. Chamado pela Server Action em
 * `app/(admin)/clientes/actions.ts`, nunca diretamente por componente.
 */
export async function cadastrarCliente(ctx: AuthContext, values: ClienteFormValues) {
  const parsed = clienteSchema.safeParse(values);
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0].message, parsed.error.issues);

  const phone = normalizarTelefone(parsed.data.phone);
  if (!phone) throw new ValidationError("Telefone inválido");

  const db = tenantDb(ctx.organizationId);

  const existing = await db.customer.findFirst({ where: { phone } });
  if (existing) throw new ConflictError("Já existe um cliente com este telefone nesta organização");

  const consent = parsed.data.consent ? novoConsentimento() : null;
  const created = await db.customer.create({
    data: {
      name: parsed.data.name,
      phone,
      email: parsed.data.email || null,
      instagram: parsed.data.instagram,
      birthDate: parsed.data.birthDate,
      notes: parsed.data.notes,
      consentAt: consent?.grantedAt,
      consentVersion: consent?.version,
    },
  });

  await writeAuditLog(ctx, { action: "cliente.cadastrado", entityType: "Customer", entityId: created.id, payload: { phone } });
  if (consent) {
    await writeAuditLog(ctx, { action: "cliente.consentimento_registrado", entityType: "Customer", entityId: created.id, payload: { version: consent.version } });
  }

  return { ok: true as const, id: created.id };
}

export async function registrarTesteMechas(
  ctx: AuthContext,
  customerId: string,
  data: { result: string; validUntil?: Date; notes?: string }
) {
  if (!data.result.trim()) throw new ValidationError("Descreva o resultado do teste");
  const db = tenantDb(ctx.organizationId);

  const customer = await db.customer.findUnique({ where: { id: customerId } });
  if (!customer) throw new NotFoundError("Cliente");

  const record = await db.strandTestRecord.create({
    data: { customerId, result: data.result, validUntil: data.validUntil, notes: data.notes },
  });

  await writeAuditLog(ctx, { action: "cliente.teste_mechas_registrado", entityType: "StrandTestRecord", entityId: record.id, payload: { customerId, result: data.result } });
  return { ok: true as const };
}

export async function arquivarCliente(ctx: AuthContext, customerId: string) {
  const db = tenantDb(ctx.organizationId);
  const customer = await db.customer.findUnique({ where: { id: customerId } });
  if (!customer) throw new NotFoundError("Cliente");

  await db.customer.update({ where: { id: customerId }, data: { archivedAt: new Date() } });
  await writeAuditLog(ctx, { action: "cliente.arquivado", entityType: "Customer", entityId: customerId, payload: {} });
  return { ok: true as const };
}

export interface ClienteListItem {
  id: string;
  name: string;
  phone: string;
  tags: string[];
}

/**
 * CORREÇÃO do achado da Operational Hardening Audit: a versão mockada nunca
 * aplicava `clienteVisivel` — clientes arquivados apareceriam normalmente.
 * Aqui o filtro é real: `archivedAt: null` no `where`, a mesma regra que
 * `clienteVisivel()` expressa em domínio puro.
 */
export async function listarClientes(ctx: AuthContext, params: { query?: string; page: number; pageSize: number }) {
  const db = tenantDb(ctx.organizationId);
  const q = params.query?.trim();

  const where = {
    archivedAt: null, // clienteVisivel() aplicado de verdade — achado da auditoria corrigido
    anonymizedAt: null,
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { phone: { contains: q.replace(/\D/g, "") } }] } : {}),
  };

  const [items, total] = await Promise.all([
    db.customer.findMany({
      where,
      include: { tags: true },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      orderBy: { name: "asc" },
    }),
    db.customer.count({ where }),
  ]);

  return {
    items: items.map((c) => ({ id: c.id, name: c.name, phone: c.phone, tags: c.tags.map((t) => t.label) })) satisfies ClienteListItem[],
    total,
    totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
  };
}

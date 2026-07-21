import { z } from "zod";
import { tenantDb } from "@/lib/db/tenant";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { ValidationError, NotFoundError } from "@/lib/errors";
import { validarDuracao } from "@/modules/services/domain/value-objects";
import type { AuthContext } from "@/lib/auth/require-auth";

const servicoSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().trim().min(1, "Nome é obrigatório"),
  durationMinutes: z.number(),
  pricingMode: z.enum(["FIXED", "QUOTE_REQUIRED"]),
  price: z.number().optional(),
  requiresCredential: z.string().nullable().optional(),
  recommendedSpecialties: z.array(z.string()).default([]),
  requiresStrandTest: z.boolean().default(false),
});
export type ServicoFormValues = z.infer<typeof servicoSchema>;

export async function cadastrarServico(ctx: AuthContext, values: ServicoFormValues) {
  const parsed = servicoSchema.safeParse(values);
  if (!parsed.success) throw new ValidationError(parsed.error.issues[0].message);

  const duracaoCheck = validarDuracao(parsed.data.durationMinutes);
  if (!duracaoCheck.valid) throw new ValidationError(duracaoCheck.reason!);

  if (parsed.data.pricingMode === "FIXED" && parsed.data.price === undefined) {
    throw new ValidationError("Serviço com preço fixo precisa de um valor");
  }

  const db = tenantDb(ctx.organizationId);
  const created = await db.service.create({
    data: {
      organizationId: ctx.organizationId,
      categoryId: parsed.data.categoryId,
      name: parsed.data.name,
      durationMinutes: parsed.data.durationMinutes,
      pricingMode: parsed.data.pricingMode,
      price: parsed.data.price,
      requiresCredential: parsed.data.requiresCredential,
      recommendedSpecialties: parsed.data.recommendedSpecialties,
      requiresStrandTest: parsed.data.requiresStrandTest,
    },
  });

  await writeAuditLog(ctx, { action: "servico.cadastrado", entityType: "Service", entityId: created.id, payload: { name: parsed.data.name } });
  return { ok: true as const, id: created.id };
}

export async function descontinuarServico(ctx: AuthContext, serviceId: string) {
  const db = tenantDb(ctx.organizationId);
  const service = await db.service.findUnique({ where: { id: serviceId } });
  if (!service) throw new NotFoundError("Serviço");

  await db.service.update({ where: { id: serviceId }, data: { discontinuedAt: new Date() } });
  await writeAuditLog(ctx, { action: "servico.descontinuado", entityType: "Service", entityId: serviceId, payload: {} });
  return { ok: true as const };
}

export interface ServicoListItem {
  id: string;
  name: string;
  category: string;
  durationMinutes: number;
  pricingMode: "FIXED" | "QUOTE_REQUIRED";
  price: number | null;
  requiresCredential: string | null;
  recommendedSpecialties: string[];
  requiresStrandTest: boolean;
  discontinuedAt: Date | null;
}

export async function listarServicos(ctx: AuthContext): Promise<ServicoListItem[]> {
  const db = tenantDb(ctx.organizationId);
  const services = await db.service.findMany({
    where: { discontinuedAt: null }, // servicoDisponivel() aplicado de verdade
    include: { category: true },
    orderBy: { name: "asc" },
  });
  return services.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category.name,
    durationMinutes: s.durationMinutes,
    pricingMode: s.pricingMode,
    price: s.price ? Number(s.price) : null,
    requiresCredential: s.requiresCredential,
    recommendedSpecialties: s.recommendedSpecialties,
    requiresStrandTest: s.requiresStrandTest,
    discontinuedAt: s.discontinuedAt,
  }));
}

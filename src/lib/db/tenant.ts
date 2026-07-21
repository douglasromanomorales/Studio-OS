import type { PrismaClient } from "@prisma/client";
import { prisma } from "./client";

/**
 * Modelos com `organizationId` DIRETO — a extensão injeta o filtro/valor
 * automaticamente para estes. Modelos filhos (ProfessionalCredential,
 * OrcamentoItem, ConsultaPhoto, etc.) NÃO têm `organizationId` próprio — são
 * escopados через a relação com o pai; a disciplina real é sempre consultar
 * através do relacionamento (`professional.credentials`), nunca solto. RLS
 * (Postgres) é a segunda camada que cobre esse ponto cego.
 */
const TENANT_MODELS = new Set([
  "Membership",
  "Professional",
  "Customer",
  "Service",
  "ServiceCategory",
  "ServiceBundle",
  "PackageTemplate",
  "Consulta",
  "Orcamento",
  "Appointment",
  "Transaction",
  "TransactionCategory",
  "CommissionPayout",
  "CashClosing",
  "AuditLog",
]);

/**
 * `tenantDb(organizationId, client?)` — o segundo parâmetro opcional é o achado
 * do retrofit de Appointment: `remarcarAppointment` precisa compor com
 * `prisma.$transaction`, e sem poder passar o client da transação, a extensão
 * aplicaria o filtro de tenant sobre uma conexão fora da transação — silenciosamente
 * incorreto. Padrão: `client` default é o `prisma` global (comportamento anterior
 * inalterado); dentro de uma transação, passa-se o `tx` recebido no callback.
 */
export function tenantDb(organizationId: string, client: Pick<PrismaClient, "$extends"> = prisma) {
  if (!organizationId) {
    throw new Error("tenantDb chamado sem organizationId — isto é um bug de infraestrutura, nunca deveria acontecer após requireAuth()");
  }

  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!TENANT_MODELS.has(model)) {
            return query(args);
          }

          const a = args as Record<string, unknown>;

          if (["findFirst", "findFirstOrThrow", "findUnique", "findUniqueOrThrow", "findMany", "update", "updateMany", "delete", "deleteMany", "count", "aggregate", "groupBy"].includes(operation)) {
            a.where = { ...(a.where as object | undefined), organizationId };
          }

          if (operation === "create") {
            a.data = { ...(a.data as object), organizationId };
          }
          if (operation === "createMany" && Array.isArray(a.data)) {
            a.data = (a.data as object[]).map((d) => ({ ...d, organizationId }));
          }

          return query(a);
        },
      },
    },
  });
}

export type TenantDb = ReturnType<typeof tenantDb>;

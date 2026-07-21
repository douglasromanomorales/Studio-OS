import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "./client";

/**
 * Modelos com `organizationId` DIRETO — o proxy injeta o filtro/valor
 * automaticamente para estes. Modelos filhos (ProfessionalCredential,
 * OrcamentoItem, ConsultaPhoto, CommissionPayoutItem, etc.) NÃO têm
 * `organizationId` próprio — são escopados através da relação com o pai; a
 * disciplina real é sempre consultar através do relacionamento
 * (`professional.credentials`), nunca solto. RLS (Postgres) é a segunda
 * camada que cobre esse ponto cego.
 */
const TENANT_MODELS = new Set([
  "Membership",
  "Professional",
  "Customer",
  "Service",
  "ServiceCategory",
  "ServiceBundle",
  "PackageTemplate",
  "Product",
  "Consulta",
  "Orcamento",
  "Appointment",
  "Transaction",
  "TransactionCategory",
  "CommissionPayout",
  "CashClosing",
  "AuditLog",
]);

/** Chave da propriedade no client (camelCase) para cada model tenant-scoped — `AuditLog` -> `auditLog`. */
const TENANT_MODEL_KEYS = new Set(
  [...TENANT_MODELS].map((m) => m.charAt(0).toLowerCase() + m.slice(1))
);

const WHERE_SCOPED_OPS = new Set([
  "findFirst",
  "findFirstOrThrow",
  "findUnique",
  "findUniqueOrThrow",
  "findMany",
  "update",
  "updateMany",
  "delete",
  "deleteMany",
  "count",
  "aggregate",
  "groupBy",
]);

export type TenantScopedClient = PrismaClient | Prisma.TransactionClient;

/**
 * `tenantDb(organizationId, client?)` — o segundo parâmetro opcional existe
 * porque `remarcarAppointment` precisa compor com `prisma.$transaction`, e o
 * filtro de tenant tem que valer sobre a MESMA conexão da transação — nunca
 * fora dela (senão a leitura/escrita escaparia do isolamento transacional,
 * silenciosamente incorreto).
 *
 * Implementação por Proxy manual, deliberadamente SEM `$extends`: o client de
 * transação do Prisma (`Prisma.TransactionClient`, o `tx` recebido no callback
 * de `$transaction`) não expõe `$extends` — é removido de propósito pelo
 * próprio Prisma nesse client (fica junto de `$connect`/`$disconnect`/`$on`).
 * Chamar `client.$extends(...)` com um `tx` quebra tanto em tempo de tipo
 * quanto em runtime. O Proxy abaixo intercepta as mesmas operações que a
 * extensão antiga interceptava, mas usando só `get`/`apply` — que funcionam
 * idênticos em cima de PrismaClient OU de Prisma.TransactionClient. Padrão:
 * `client` default é o `prisma` global (comportamento anterior inalterado);
 * dentro de uma transação, passa-se o `tx` recebido no callback.
 */
export function tenantDb(organizationId: string, client: TenantScopedClient = prisma): TenantScopedClient {
  if (!organizationId) {
    throw new Error("tenantDb chamado sem organizationId — isto é um bug de infraestrutura, nunca deveria acontecer após requireAuth()");
  }

  return new Proxy(client, {
    get(target, prop, receiver) {
      const original = Reflect.get(target, prop, receiver);

      if (typeof prop !== "string" || !TENANT_MODEL_KEYS.has(prop) || typeof original !== "object" || original === null) {
        return original;
      }

      // property é um model delegate (ex.: client.appointment) — envolve cada método de operação
      return new Proxy(original, {
        get(modelTarget, opProp, modelReceiver) {
          const fn = Reflect.get(modelTarget, opProp, modelReceiver);
          if (typeof fn !== "function" || typeof opProp !== "string") return fn;

          return (args: Record<string, unknown> = {}) => {
            const a: Record<string, unknown> = { ...args };

            if (WHERE_SCOPED_OPS.has(opProp)) {
              a.where = { ...(a.where as object | undefined), organizationId };
            }
            if (opProp === "create") {
              a.data = { ...(a.data as object), organizationId };
            }
            if (opProp === "createMany" && Array.isArray(a.data)) {
              a.data = (a.data as object[]).map((d) => ({ ...d, organizationId }));
            }
            if (opProp === "upsert") {
              a.where = { ...(a.where as object | undefined), organizationId };
              a.create = { ...(a.create as object), organizationId };
              a.update = { ...(a.update as object) };
            }

            return fn.call(modelTarget, a);
          };
        },
      });
    },
  }) as TenantScopedClient;
}

export type TenantDb = ReturnType<typeof tenantDb>;


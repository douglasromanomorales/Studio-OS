import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "./client";

const TENANT_MODELS = new Set([
  "Membership","Professional","Customer","Service","ServiceCategory",
  "ServiceBundle","PackageTemplate","Consulta","Orcamento","Appointment",
  "Transaction","TransactionCategory","CommissionPayout","CashClosing","AuditLog",
]);

type DbClient = PrismaClient | Prisma.TransactionClient;

export function tenantDb(
  organizationId: string,
  client: DbClient = prisma
) {
  if (!organizationId) {
    throw new Error("tenantDb chamado sem organizationId.");
  }

  if (!("$extends" in client)) {
    return client;
  }

  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!TENANT_MODELS.has(model)) return query(args);

          const a = args as Record<string, unknown>;

          if ([
            "findFirst","findFirstOrThrow","findUnique","findUniqueOrThrow",
            "findMany","update","updateMany","delete","deleteMany",
            "count","aggregate","groupBy"
          ].includes(operation)) {
            a.where = { ...(a.where as object | undefined), organizationId };
          }

          if (operation === "create") {
            a.data = { ...(a.data as object), organizationId };
          }

          if (operation === "createMany" && Array.isArray(a.data)) {
            a.data = (a.data as object[]).map(d => ({ ...d, organizationId }));
          }

          return query(a);
        },
      },
    },
  });
}

export type TenantDb = ReturnType<typeof tenantDb>;

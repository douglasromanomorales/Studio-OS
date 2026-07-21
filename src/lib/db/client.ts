import { PrismaClient } from "@prisma/client";

/**
 * Client cru — usado SÓ pela camada de auth (User/Account/Session/VerificationToken,
 * que não são tenant-scoped). Nenhum Application Service deveria importar isto
 * diretamente; eles usam `tenantDb(organizationId)` (./tenant.ts).
 *
 * Singleton cacheado em globalThis para sobreviver a hot-reload em desenvolvimento
 * (padrão Next.js — sem isso, cada reload abriria uma conexão nova).
 */
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}

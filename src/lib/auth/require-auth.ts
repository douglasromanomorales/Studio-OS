import { cache } from "react";
import { headers } from "next/headers";
import { prisma } from "../db/client";
import { auth } from "./auth";
import { hasCapability, AuthorizationError, type Capability, type StaffRole } from "./policies";
import { writeAuthorizationDenied } from "../audit/write-audit-log";

export interface AuthContext {
  userId: string;
  organizationId: string;
  role: StaffRole;
  impersonatedByUserId?: string;
  requestId?: string;
}

/**
 * Memoizado por requisição (React cache) — Membership resolvida uma vez, nunca
 * uma query por checagem de permissão dentro da mesma requisição (ITS, seção 2).
 */
export const requireAuth = cache(async (): Promise<AuthContext> => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AuthorizationError("Sessão inválida — faça login novamente");
  }

  // TODO ambiente real: ler activeOrganizationId/impersonatingUserId da Session real.
  const dbSession = await prisma.session.findFirst({
    where: { userId: session.user.id },
    orderBy: { expires: "desc" },
  });
  if (!dbSession?.activeOrganizationId) {
    throw new AuthorizationError("Nenhuma organização ativa na sessão");
  }

  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: dbSession.activeOrganizationId } },
  });
  if (!membership) {
    throw new AuthorizationError("Usuário não é membro desta organização");
  }

  const headersList = await headers();
  return {
    userId: session.user.id,
    organizationId: dbSession.activeOrganizationId,
    role: membership.role as StaffRole,
    impersonatedByUserId: dbSession.impersonatedByUserId ?? undefined,
    requestId: headersList.get("x-request-id") ?? undefined,
  };
});

/**
 * Chamado logo após `requireAuth()`, antes do Application Service. Negação
 * gera AuditLog (ITS: tentativa recusada é tão auditável quanto sucesso).
 */
export async function requireCapability(ctx: AuthContext, capability: Capability): Promise<void> {
  if (!hasCapability(ctx.role, capability)) {
    await writeAuthorizationDenied(
      { organizationId: ctx.organizationId, userId: ctx.userId, impersonatedByUserId: ctx.impersonatedByUserId, requestId: ctx.requestId },
      capability,
      `role ${ctx.role} sem a capacidade ${capability}`
    );
    throw new AuthorizationError(`Você não tem permissão para: ${capability}`);
  }
}

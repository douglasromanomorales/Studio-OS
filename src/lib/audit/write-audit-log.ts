import { Prisma } from "@prisma/client";
import { prisma } from "../db/client";
import { logger } from "../logging/logger";

export interface AuditContext {
  organizationId: string;
  userId: string;
  impersonatedByUserId?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditEvent {
  action: string; // mesmo nome já usado em todo emitirEvento() de cada domínio
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
  correlationId?: string;
}

/**
 * Mascaramento mínimo de payload (ITS, seção 5) — nunca grava telefone completo
 * no log de auditoria, mesmo que a entidade referenciada já tenha o valor real.
 * Lista pequena e explícita, não uma heurística "adivinha o que é PII" — mais
 * seguro errar mascarando de mais do que de menos.
 */
const MASKED_KEYS = new Set(["phone", "telefone", "email", "document", "cpf", "cnpj"]);

function maskPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const masked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (MASKED_KEYS.has(key.toLowerCase()) && typeof value === "string") {
      masked[key] = value.length > 4 ? `***${value.slice(-4)}` : "***";
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

/**
 * Este é o sink real que a Fase 3.3 prometia: emitirEvento() em cada domínio
 * (Cliente, Profissional, Serviço, Quote, Appointment, Financeiro) já tem a
 * forma certa desde que foram escritos — a migração é chamar isto no lugar do
 * console.log, em cada Application Service, sem mudar a assinatura delas.
 */
export async function writeAuditLog(ctx: AuditContext, event: AuditEvent) {
  try {
    await prisma.auditLog.create({
      data: {
        organizationId: ctx.organizationId,
        userId: ctx.userId,
        impersonatedByUserId: ctx.impersonatedByUserId,
        requestId: ctx.requestId,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        action: event.action,
        entityType: event.entityType,
        entityId: event.entityId,
        payload: maskPayload(event.payload) as Prisma.InputJsonValue,
        correlationId: event.correlationId,
      },
    });
    logger.info(event.action, { organizationId: ctx.organizationId, entityId: event.entityId, requestId: ctx.requestId });
  } catch (err) {
    // Falha ao gravar auditoria nunca pode derrubar a operação de negócio que a
    // originou — registra o erro de infraestrutura separadamente e segue.
    logger.error("auditlog.write_failed", { error: err instanceof Error ? err.message : String(err), action: event.action });
  }
}

/** Auditoria de tentativa negada — AuthorizationError também é auditável (ITS, seção 6). */
export async function writeAuthorizationDenied(ctx: AuditContext, action: string, reason: string) {
  await writeAuditLog(ctx, { action: "authorization.denied", entityType: "AuthorizationAttempt", entityId: action, payload: { reason } });
}

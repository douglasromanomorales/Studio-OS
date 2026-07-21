/**
 * Taxonomia de erro do ITS, seção 6 — cada classe nasce numa camada específica,
 * nunca misturada. `httpStatus` existe para quem for expor isso via API Route
 * (webhooks); Server Actions retornam `{ ok: false, error }` como já faziam
 * desde o primeiro Application Service, sem mudar esse formato.
 */

export class ValidationError extends Error {
  readonly httpStatus = 400;
  constructor(message: string, public readonly issues?: unknown) {
    super(message);
    this.name = "ValidationError";
  }
}

/** Regra de domínio violada — nasce em Specification ou Application Service. */
export class BusinessError extends Error {
  readonly httpStatus = 422;
  constructor(message: string) {
    super(message);
    this.name = "BusinessError";
  }
}

export class NotFoundError extends Error {
  readonly httpStatus = 404;
  constructor(entityType: string) {
    // Mesma mensagem para "não existe" e "existe mas não é desta organização" —
    // nunca vazar existência entre tenants (ITS, seção 6).
    super(`${entityType} não encontrado`);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends Error {
  readonly httpStatus = 409;
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export class ConcurrencyError extends Error {
  readonly httpStatus = 409;
  constructor(entityType: string) {
    super(`${entityType} foi alterado por outra pessoa enquanto você editava — recarregue e tente de novo`);
    this.name = "ConcurrencyError";
  }
}

export class InfrastructureError extends Error {
  readonly httpStatus = 500;
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "InfrastructureError";
  }
}

export { AuthorizationError } from "./auth/policies";

/** Converte qualquer erro conhecido em `{ ok: false, error }` — formato já usado desde o primeiro Application Service. */
export function toActionResult(err: unknown): { ok: false; error: string } {
  if (err instanceof Error) return { ok: false, error: err.message };
  return { ok: false, error: "Erro inesperado" };
}

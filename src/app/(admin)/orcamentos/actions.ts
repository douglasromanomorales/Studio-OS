"use server";

import { requireAuth, requireCapability } from "@/lib/auth/require-auth";
import { toActionResult } from "@/lib/errors";
import * as service from "@/modules/quotes/application/quote.service";
import type { CriarOrcamentoValues } from "@/modules/quotes/application/quote.service";

export type { CriarOrcamentoValues };

export async function criarOrcamentoAction(values: CriarOrcamentoValues) {
  try {
    const ctx = await requireAuth();
    await requireCapability(ctx, "consultas.gerenciar");
    return { ok: true as const, ...(await service.criarOrcamento(ctx, values)) };
  } catch (err) {
    return toActionResult(err);
  }
}

export async function enviarOrcamentoAction(orcamentoId: string) {
  try {
    const ctx = await requireAuth();
    await requireCapability(ctx, "orcamentos.aprovar");
    return await service.enviarOrcamento(ctx, orcamentoId);
  } catch (err) {
    return toActionResult(err);
  }
}

export async function aprovarOrcamentoAction(orcamentoId: string) {
  try {
    const ctx = await requireAuth();
    await requireCapability(ctx, "orcamentos.aprovar");
    return await service.aprovarOrcamento(ctx, orcamentoId);
  } catch (err) {
    return toActionResult(err);
  }
}

export async function recusarOrcamentoAction(orcamentoId: string) {
  try {
    const ctx = await requireAuth();
    await requireCapability(ctx, "orcamentos.aprovar");
    return await service.recusarOrcamento(ctx, orcamentoId);
  } catch (err) {
    return toActionResult(err);
  }
}

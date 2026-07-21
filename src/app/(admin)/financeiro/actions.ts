"use server";

import { requireAuth, requireCapability } from "@/lib/auth/require-auth";
import { toActionResult } from "@/lib/errors";
import * as service from "@/modules/finance/application/finance.service";
import type { RegistrarRecebimentoValues } from "@/modules/finance/application/finance.service";

export type { RegistrarRecebimentoValues };
export type { TransactionListItem, PendenciaItem } from "@/modules/finance/application/finance.service";

export async function registrarRecebimentoAction(values: RegistrarRecebimentoValues) {
  try {
    const ctx = await requireAuth();
    await requireCapability(ctx, "financeiro.gerenciar");
    return await service.registrarRecebimento(ctx, values);
  } catch (err) {
    return toActionResult(err);
  }
}

export async function registrarEstornoAction(transacaoOriginalId: string) {
  try {
    const ctx = await requireAuth();
    await requireCapability(ctx, "financeiro.gerenciar");
    return await service.registrarEstorno(ctx, transacaoOriginalId);
  } catch (err) {
    return toActionResult(err);
  }
}

export async function listarTransacoesDoDiaAction(dia: Date) {
  const ctx = await requireAuth();
  await requireCapability(ctx, "financeiro.gerenciar");
  return service.listarTransacoesDoDia(ctx, dia);
}

export async function listarPendenciasAction() {
  const ctx = await requireAuth();
  await requireCapability(ctx, "financeiro.gerenciar");
  return service.listarPendencias(ctx);
}

export async function listarCategoriasAction() {
  const ctx = await requireAuth();
  await requireCapability(ctx, "financeiro.gerenciar");
  return service.listarCategorias(ctx);
}

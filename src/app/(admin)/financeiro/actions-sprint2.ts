"use server";

import { requireAuth, requireCapability } from "@/lib/auth/require-auth";
import { toActionResult } from "@/lib/errors";
import * as service from "@/modules/finance/application/commission.service";

export type { ApuracaoPreview, CommissionPayoutHistoryItem } from "@/modules/finance/application/commission.service";

export async function apurarComissaoDoProfissionalAction(professionalId: string, periodStart: Date, periodEnd: Date) {
  const ctx = await requireAuth();
  await requireCapability(ctx, "financeiro.gerenciar");
  return service.apurarComissaoDoProfissional(ctx, professionalId, periodStart, periodEnd);
}

export async function pagarComissaoAction(
  professionalId: string,
  periodStart: Date,
  periodEnd: Date,
  method: "PIX" | "CARD_CREDIT" | "CARD_DEBIT" | "CASH" | "TRANSFER"
) {
  try {
    const ctx = await requireAuth();
    await requireCapability(ctx, "financeiro.gerenciar");
    return await service.pagarComissao(ctx, professionalId, periodStart, periodEnd, method);
  } catch (err) {
    return toActionResult(err);
  }
}

export async function ajustarComissaoPagaAction(payoutOriginalId: string, motivo: string) {
  try {
    const ctx = await requireAuth();
    await requireCapability(ctx, "financeiro.gerenciar");
    return await service.ajustarComissaoPaga(ctx, payoutOriginalId, motivo);
  } catch (err) {
    return toActionResult(err);
  }
}

export async function listarHistoricoComissoesAction() {
  const ctx = await requireAuth();
  await requireCapability(ctx, "financeiro.gerenciar");
  return service.listarHistoricoComissoes(ctx);
}

export async function fecharCaixaAction(dia: Date, countedCents: number, closedByMembershipId: string) {
  try {
    const ctx = await requireAuth();
    await requireCapability(ctx, "financeiro.gerenciar");
    return await service.fecharCaixa(ctx, dia, countedCents, closedByMembershipId);
  } catch (err) {
    return toActionResult(err);
  }
}

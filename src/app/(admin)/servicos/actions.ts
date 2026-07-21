"use server";

import { requireAuth, requireCapability } from "@/lib/auth/require-auth";
import { toActionResult } from "@/lib/errors";
import { requiresConsultation } from "@/modules/services/domain/specifications";
import * as service from "@/modules/services/application/service.service";
import type { ServicoFormValues } from "@/modules/services/application/service.service";

export type { ServicoFormValues };
export type { ServicoListItem } from "@/modules/services/application/service.service";
export { requiresConsultation };

export async function cadastrarServicoAction(values: ServicoFormValues) {
  try {
    const ctx = await requireAuth();
    await requireCapability(ctx, "servicos.gerenciar");
    return await service.cadastrarServico(ctx, values);
  } catch (err) {
    return toActionResult(err);
  }
}

export async function descontinuarServicoAction(serviceId: string) {
  try {
    const ctx = await requireAuth();
    await requireCapability(ctx, "servicos.gerenciar");
    return await service.descontinuarServico(ctx, serviceId);
  } catch (err) {
    return toActionResult(err);
  }
}

export async function listarServicosAction() {
  const ctx = await requireAuth();
  await requireCapability(ctx, "servicos.ver");
  return service.listarServicos(ctx);
}

"use server";

import { requireAuth, requireCapability } from "@/lib/auth/require-auth";
import { toActionResult } from "@/lib/errors";
import * as service from "@/modules/professionals/application/professional.service";
import type { ProfissionalFormValues } from "@/modules/professionals/application/professional.service";

export type { ProfissionalFormValues };
export type { ProfissionalListItem } from "@/modules/professionals/application/professional.service";

export async function cadastrarProfissionalAction(values: ProfissionalFormValues) {
  try {
    const ctx = await requireAuth();
    await requireCapability(ctx, "profissionais.gerenciar");
    return await service.cadastrarProfissional(ctx, values);
  } catch (err) {
    return toActionResult(err);
  }
}

export async function registrarCredencialAction(professionalId: string, data: { name: string; registryNumber?: string; validUntil?: Date }) {
  try {
    const ctx = await requireAuth();
    await requireCapability(ctx, "profissionais.gerenciar");
    return await service.registrarCredencial(ctx, professionalId, data);
  } catch (err) {
    return toActionResult(err);
  }
}

export async function declararEspecialidadeAction(professionalId: string, name: string, level?: string) {
  try {
    const ctx = await requireAuth();
    await requireCapability(ctx, "profissionais.gerenciar");
    return await service.declararEspecialidade(ctx, professionalId, name, level);
  } catch (err) {
    return toActionResult(err);
  }
}

export async function desligarProfissionalAction(professionalId: string) {
  try {
    const ctx = await requireAuth();
    await requireCapability(ctx, "profissionais.gerenciar");
    return await service.desligarProfissional(ctx, professionalId);
  } catch (err) {
    return toActionResult(err);
  }
}

export async function listarProfissionaisAction() {
  const ctx = await requireAuth();
  await requireCapability(ctx, "profissionais.gerenciar");
  return service.listarProfissionais(ctx);
}

"use server";

import { requireAuth, requireCapability } from "@/lib/auth/require-auth";
import * as service from "@/modules/consultations/application/consultation.service";

export async function listConsultasAction() {
  const ctx = await requireAuth();
  await requireCapability(ctx, "consultas.gerenciar");
  return service.listConsultas(ctx);
}

export async function getConsultaAction(id: string) {
  const ctx = await requireAuth();
  await requireCapability(ctx, "consultas.gerenciar");
  return service.getConsulta(ctx, id);
}

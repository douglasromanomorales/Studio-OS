"use server";

import { requireAuth, requireCapability } from "@/lib/auth/require-auth";
import { toActionResult } from "@/lib/errors";
import type { ConsultaFormValues } from "@/lib/validations/consulta";
import * as service from "@/modules/consultations/application/consultation.service";

export async function searchCustomersAction(query: string) {
  const ctx = await requireAuth();
  await requireCapability(ctx, "consultas.gerenciar");
  return service.searchCustomers(ctx, query);
}

export async function createConsultaAction(values: ConsultaFormValues & { precisaTesteMechas: boolean }) {
  try {
    const ctx = await requireAuth();
    await requireCapability(ctx, "consultas.gerenciar");
    return { ok: true as const, ...(await service.createConsulta(ctx, values)) };
  } catch (err) {
    return toActionResult(err);
  }
}

export async function createCustomerQuickAction(data: { name: string; phone: string }) {
  try {
    const ctx = await requireAuth();
    await requireCapability(ctx, "clientes.gerenciar");
    return { ok: true as const, ...(await service.createCustomerQuick(ctx, data)) };
  } catch (err) {
    return toActionResult(err);
  }
}

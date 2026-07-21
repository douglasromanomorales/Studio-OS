"use server";

import { requireAuth, requireCapability } from "@/lib/auth/require-auth";
import { toActionResult } from "@/lib/errors";
import * as service from "@/modules/customers/application/customer.service";
import type { ClienteFormValues } from "@/modules/customers/application/customer.service";

export type { ClienteFormValues };
export type { ClienteListItem } from "@/modules/customers/application/customer.service";

/**
 * Toda função aqui é a fronteira real de Server Action — `organizationId` nunca
 * é parâmetro (ITS, seção 3). A UI chama estas funções diretamente; o Application
 * Service em `customer.service.ts` nunca é importado por componente algum.
 */
export async function cadastrarClienteAction(values: ClienteFormValues) {
  try {
    const ctx = await requireAuth();
    await requireCapability(ctx, "clientes.gerenciar");
    return await service.cadastrarCliente(ctx, values);
  } catch (err) {
    return toActionResult(err);
  }
}

export async function registrarTesteMechasAction(customerId: string, data: { result: string; validUntil?: Date; notes?: string }) {
  try {
    const ctx = await requireAuth();
    await requireCapability(ctx, "clientes.gerenciar");
    return await service.registrarTesteMechas(ctx, customerId, data);
  } catch (err) {
    return toActionResult(err);
  }
}

export async function arquivarClienteAction(customerId: string) {
  try {
    const ctx = await requireAuth();
    await requireCapability(ctx, "clientes.gerenciar");
    return await service.arquivarCliente(ctx, customerId);
  } catch (err) {
    return toActionResult(err);
  }
}

export async function listarClientesAction(params: { query?: string; page: number; pageSize: number }) {
  const ctx = await requireAuth();
  await requireCapability(ctx, "clientes.gerenciar");
  return service.listarClientes(ctx, params);
}

"use server";

import { requireAuth, requireCapability } from "@/lib/auth/require-auth";
import { toActionResult } from "@/lib/errors";
import * as service from "@/modules/appointments/application/appointment.service";
import type { CriarAppointmentInput } from "@/modules/appointments/application/appointment.service";

export type { CriarAppointmentInput };
export type { AppointmentListItem } from "@/modules/appointments/application/appointment.service";

export async function criarAppointmentAction(input: CriarAppointmentInput) {
  try {
    const ctx = await requireAuth();
    await requireCapability(ctx, "agenda.gerenciar");
    return { ok: true as const, ...(await service.criarAppointment(ctx, input)) };
  } catch (err) {
    return toActionResult(err);
  }
}

export async function confirmarAppointmentAction(appointmentId: string) {
  try {
    const ctx = await requireAuth();
    await requireCapability(ctx, "agenda.gerenciar");
    return await service.confirmarAppointment(ctx, appointmentId);
  } catch (err) {
    return toActionResult(err);
  }
}

export async function cancelarAppointmentAction(
  appointmentId: string,
  reason: "CLIENT_REQUEST" | "RESCHEDULED" | "PROFESSIONAL_UNAVAILABLE" | "OTHER"
) {
  try {
    const ctx = await requireAuth();
    await requireCapability(ctx, "agenda.gerenciar");
    return await service.cancelarAppointment(ctx, appointmentId, reason);
  } catch (err) {
    return toActionResult(err);
  }
}

export async function ajustarDuracaoAppointmentAction(appointmentId: string, novaDuracaoMin: number) {
  try {
    const ctx = await requireAuth();
    await requireCapability(ctx, "agenda.gerenciar");
    return await service.ajustarDuracaoAppointment(ctx, appointmentId, novaDuracaoMin);
  } catch (err) {
    return toActionResult(err);
  }
}

export async function remarcarAppointmentAction(appointmentId: string, novoStartAt: Date) {
  try {
    const ctx = await requireAuth();
    await requireCapability(ctx, "agenda.gerenciar");
    return { ok: true as const, ...(await service.remarcarAppointment(ctx, appointmentId, novoStartAt)) };
  } catch (err) {
    return toActionResult(err);
  }
}

export async function listarAppointmentsDoDiaAction(dia: Date) {
  const ctx = await requireAuth();
  await requireCapability(ctx, "agenda.ver_propria");
  return service.listarAppointmentsDoDia(ctx, dia);
}

export async function listarProfissionaisDaGradeAction() {
  const ctx = await requireAuth();
  await requireCapability(ctx, "agenda.ver_propria");
  return service.listarProfissionaisDaGrade(ctx);
}

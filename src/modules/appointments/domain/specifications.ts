/**
 * Specifications que pertencem ao Appointment (modelagem, seção 6). Tudo aqui opera
 * só sobre dado que o próprio Appointment possui — nunca decide elegibilidade de
 * Cliente/Profissional/Serviço/Quote, que são consultadas pelo Application Service,
 * não reimplementadas aqui (Coordination Over Ownership).
 */

export interface AppointmentInterval {
  id: string;
  professionalId: string;
  startAt: Date;
  endAt: Date;
  status: "SCHEDULED" | "CONFIRMED" | "DONE" | "NO_SHOW" | "CANCELED";
}

/**
 * A única regra de negócio genuinamente própria da Agenda, confirmada duas vezes
 * (Blueprint e Responsibility Matrix). Cancelados não contam como colisão.
 */
export function haColisaoDeHorario(
  candidato: { professionalId: string; startAt: Date; endAt: Date; excludeId?: string },
  existentes: AppointmentInterval[]
): boolean {
  return existentes.some((a) => {
    if (a.id === candidato.excludeId) return false;
    if (a.professionalId !== candidato.professionalId) return false;
    if (a.status === "CANCELED") return false;
    return a.startAt < candidato.endAt && candidato.startAt < a.endAt;
  });
}

/** Substitui o estado IN_PROGRESS, que não existe mais no enum (Derived Over Stored). */
export function atendimentoEmAndamento(
  appointment: { status: string; startAt: Date; endAt: Date },
  agora = new Date()
): boolean {
  return appointment.status === "CONFIRMED" && agora >= appointment.startAt && agora < appointment.endAt;
}

type Status = "SCHEDULED" | "CONFIRMED" | "DONE" | "NO_SHOW" | "CANCELED";

export function podeConfirmar(status: Status): boolean {
  return status === "SCHEDULED";
}
export function podeCancelar(status: Status): boolean {
  return status === "SCHEDULED" || status === "CONFIRMED";
}
export function podeMarcarConcluido(status: Status): boolean {
  return status === "CONFIRMED";
}
export function podeMarcarNoShow(status: Status): boolean {
  return status === "CONFIRMED";
}

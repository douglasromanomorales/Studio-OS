"use client";

import * as React from "react";
import { Card } from "@/design-system/primitives/card";
import { Avatar } from "@/design-system/primitives/avatar";
import { Badge } from "@/design-system/primitives/badge";
import { Button } from "@/design-system/primitives/button";
import { EmptyState } from "@/design-system/primitives/empty-state";
import { Calendar } from "lucide-react";
import { toast } from "@/design-system/primitives/toast";
import { confirmarAppointmentAction, type AppointmentListItem } from "./actions";

const STATUS_LABEL: Record<string, { label: string; variant: "warning" | "brand" | "success" | "danger" | "neutral" }> = {
  SCHEDULED: { label: "Agendado", variant: "warning" },
  CONFIRMED: { label: "Confirmado", variant: "brand" },
  DONE: { label: "Concluído", variant: "success" },
  NO_SHOW: { label: "Não compareceu", variant: "danger" },
  CANCELED: { label: "Cancelado", variant: "neutral" },
};

/**
 * Mobile Capable, não Mobile First (Design Language, cap. 6.1): não oferece
 * produtividade máxima (sem arrastar, sem redimensionar) mas cobre exatamente as
 * operações que a regra exige — confirmar, cancelar, consultar. Reagendar
 * continua disponível através do Sheet (o mesmo componente da grade desktop).
 */
export function AgendaMobileList({
  appointments,
  onOpen,
  onChanged,
}: {
  appointments: AppointmentListItem[];
  onOpen: (appt: AppointmentListItem) => void;
  onChanged: () => void;
}) {
  const [busyId, setBusyId] = React.useState<string | null>(null);

  if (appointments.length === 0) {
    return (
      <EmptyState
        icon={<Calendar />}
        title="Nenhum agendamento hoje"
        description="A agenda de hoje está livre."
      />
    );
  }

  async function handleConfirmar(appt: AppointmentListItem) {
    setBusyId(appt.id);
    const result = await confirmarAppointmentAction(appt.id);
    setBusyId(null);
    if (!result.ok) return toast.error("Não foi possível confirmar");
    toast.success("Agendamento confirmado");
    onChanged();
  }

  const ordenados = [...appointments].sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

  return (
    <ul className="flex flex-col gap-3 px-4 pb-8" aria-label="Agendamentos de hoje">
      {ordenados.map((appt) => {
        const status = STATUS_LABEL[appt.status];
        return (
          <li key={appt.id}>
            <Card padding="md" interactive onClick={() => onOpen(appt)} className="flex items-center gap-3">
              <div className="text-center shrink-0 w-12">
                <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                  {appt.startAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <Avatar name={appt.customerName} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{appt.customerName}</p>
                <p className="text-xs text-[var(--text-muted)] truncate">
                  {appt.serviceName} · {appt.professionalName}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <Badge variant={status.variant} dot>
                  {status.label}
                </Badge>
                {appt.status === "SCHEDULED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    loading={busyId === appt.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConfirmar(appt);
                    }}
                  >
                    Confirmar
                  </Button>
                )}
              </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}

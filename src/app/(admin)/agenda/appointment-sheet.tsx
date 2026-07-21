"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody, SheetFooter } from "@/design-system/primitives/sheet";
import { Button } from "@/design-system/primitives/button";
import { Badge } from "@/design-system/primitives/badge";
import { ConfirmationDialog } from "@/design-system/primitives/confirmation-dialog";
import { TimePicker } from "@/design-system/primitives/time-picker";
import { toast } from "@/design-system/primitives/toast";
import { confirmarAppointmentAction, cancelarAppointmentAction, remarcarAppointmentAction, type AppointmentListItem } from "./actions";

const STATUS_LABEL: Record<string, { label: string; variant: "warning" | "brand" | "success" | "danger" | "neutral" }> = {
  SCHEDULED: { label: "Agendado", variant: "warning" },
  CONFIRMED: { label: "Confirmado", variant: "brand" },
  DONE: { label: "Concluído", variant: "success" },
  NO_SHOW: { label: "Não compareceu", variant: "danger" },
  CANCELED: { label: "Cancelado", variant: "neutral" },
};

export function AppointmentSheet({
  appointment,
  onOpenChange,
  onChanged,
}: {
  appointment: AppointmentListItem;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  const [confirmCancelOpen, setConfirmCancelOpen] = React.useState(false);
  const [rescheduling, setRescheduling] = React.useState(false);
  const [newTime, setNewTime] = React.useState<string | undefined>();
  const [busy, setBusy] = React.useState(false);
  const status = STATUS_LABEL[appointment.status];

  async function handleConfirmar() {
    setBusy(true);
    const result = await confirmarAppointmentAction(appointment.id);
    setBusy(false);
    if (!result.ok) return toast.error("Não foi possível confirmar");
    toast.success("Agendamento confirmado");
    onChanged();
  }

  async function handleCancelar() {
    setBusy(true);
    const result = await cancelarAppointmentAction(appointment.id, "CLIENT_REQUEST");
    setBusy(false);
    setConfirmCancelOpen(false);
    if (!result.ok) return toast.error("Não foi possível cancelar", result.error);
    toast.success("Agendamento cancelado");
    onChanged();
  }

  async function handleRemarcar() {
    if (!newTime) return;
    const [h, m] = newTime.split(":").map(Number);
    const novoStartAt = new Date(appointment.startAt);
    novoStartAt.setHours(h, m, 0, 0);

    setBusy(true);
    const result = await remarcarAppointmentAction(appointment.id, novoStartAt);
    setBusy(false);
    if (!result.ok) return toast.error("Não foi possível remarcar", result.error);
    toast.success("Agendamento remarcado");
    onChanged();
  }

  return (
    <>
      <Sheet open onOpenChange={onOpenChange}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{appointment.customerName}</SheetTitle>
            <SheetDescription>{appointment.serviceName}</SheetDescription>
          </SheetHeader>
          <SheetBody className="flex flex-col gap-4">
            <Badge variant={status.variant} dot>
              {status.label}
            </Badge>
            <p className="text-sm text-[var(--text-secondary)]">
              {appointment.startAt.toLocaleString("pt-BR", { weekday: "long", hour: "2-digit", minute: "2-digit" })} com{" "}
              {appointment.professionalName}
            </p>

            {rescheduling && (
              <div className="flex flex-col gap-2">
                <TimePicker value={newTime} onValueChange={setNewTime} placeholder="Novo horário" />
                <Button size="sm" onClick={handleRemarcar} loading={busy} disabled={!newTime}>
                  Confirmar novo horário
                </Button>
              </div>
            )}
          </SheetBody>
          <SheetFooter>
            {appointment.status === "SCHEDULED" && (
              <Button variant="outline" onClick={handleConfirmar} loading={busy}>
                Confirmar
              </Button>
            )}
            {(appointment.status === "SCHEDULED" || appointment.status === "CONFIRMED") && (
              <>
                <Button variant="ghost" onClick={() => setRescheduling((v) => !v)}>
                  Remarcar
                </Button>
                <Button variant="destructive" onClick={() => setConfirmCancelOpen(true)}>
                  Cancelar
                </Button>
              </>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmationDialog
        open={confirmCancelOpen}
        onOpenChange={setConfirmCancelOpen}
        title="Cancelar agendamento?"
        description={`O horário de ${appointment.customerName} às ${appointment.startAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} será liberado.`}
        confirmLabel="Cancelar agendamento"
        destructive
        loading={busy}
        onConfirm={handleCancelar}
      />
    </>
  );
}

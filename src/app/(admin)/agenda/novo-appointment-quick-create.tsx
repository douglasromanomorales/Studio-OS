"use client";

import * as React from "react";
import { QuickCreate } from "@/design-system/primitives/quick-create";
import { Field } from "@/design-system/primitives/field";
import { Combobox, type ComboboxOption } from "@/design-system/primitives/combobox";
import { toast } from "@/design-system/primitives/toast";
import { criarAppointmentAction } from "./actions";

const SERVICE_OPTIONS: ComboboxOption[] = [
  { value: "s3", label: "Bronze Natural – Aplicação" },
  { value: "s4", label: "Manicure" },
];
const CUSTOMER_OPTIONS: ComboboxOption[] = [
  { value: "c1", label: "Ana Paula Ferreira", description: "(13) 99999-1111" },
];

export function NovoAppointmentQuickCreate({
  professionalId,
  startAt,
  onOpenChange,
  onCreated,
}: {
  professionalId: string;
  startAt: Date;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [customerId, setCustomerId] = React.useState("");
  const [serviceId, setServiceId] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  async function handleSubmit() {
    setSaving(true);
    const result = await criarAppointmentAction({
      customerId,
      professionalId,
      serviceId,
      startAt,
      origin: "ADMIN",
    });
    setSaving(false);
    if (!result.ok) {
      toast.error("Não foi possível agendar", result.error);
      return;
    }
    toast.success("Agendamento criado");
    onCreated();
  }

  return (
    <QuickCreate
      open
      onOpenChange={onOpenChange}
      title="Novo agendamento"
      description={startAt.toLocaleString("pt-BR", { weekday: "long", hour: "2-digit", minute: "2-digit" })}
      onSubmit={handleSubmit}
      loading={saving}
      submitDisabled={!customerId || !serviceId}
    >
      <Field label="Cliente" htmlFor="a-customer" required>
        <Combobox id="a-customer" options={CUSTOMER_OPTIONS} value={customerId} onValueChange={setCustomerId} placeholder="Buscar cliente..." />
      </Field>
      <Field label="Serviço" htmlFor="a-service" required>
        <Combobox id="a-service" options={SERVICE_OPTIONS} value={serviceId} onValueChange={setServiceId} placeholder="Buscar serviço..." />
      </Field>
    </QuickCreate>
  );
}

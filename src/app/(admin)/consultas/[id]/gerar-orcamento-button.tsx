"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/design-system/primitives/button";
import { QuickCreate } from "@/design-system/primitives/quick-create";
import { Field } from "@/design-system/primitives/field";
import { Combobox, type ComboboxOption } from "@/design-system/primitives/combobox";
import { CurrencyInput } from "@/design-system/primitives/currency-input";
import { toast } from "@/design-system/primitives/toast";
import { criarOrcamentoAction } from "@/app/(admin)/orcamentos/actions";

// TODO: tenantDb(organizationId).service.findMany — reflete o catálogo real.
const SERVICES = [
  { id: "s1", name: "Mechas (tradicionais, iluminadas e personalizadas)", durationMinutes: 180 },
  { id: "s2", name: "Correção de cor", durationMinutes: 240 },
];
const SERVICE_OPTIONS: ComboboxOption[] = SERVICES.map((s) => ({ value: s.id, label: s.name }));

export function GerarOrcamentoButton({
  consultaId,
  professionalId,
  disabled,
}: {
  consultaId: string;
  professionalId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [serviceId, setServiceId] = React.useState("");
  const [amountCents, setAmountCents] = React.useState(0);
  const [saving, setSaving] = React.useState(false);

  const selectedService = SERVICES.find((s) => s.id === serviceId);

  async function handleSubmit() {
    if (!selectedService) return;
    setSaving(true);
    const result = await criarOrcamentoAction({
      consultaId,
      professionalId,
      items: [
        {
          serviceId: selectedService.id,
          serviceNameSnapshot: selectedService.name,
          amountCents,
          durationMinutesSnapshot: selectedService.durationMinutes,
        },
      ],
    });
    setSaving(false);
    if (!result.ok) {
      toast.error("Não foi possível criar o orçamento", result.error);
      return;
    }
    toast.success("Orçamento criado", `Total: ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(result.total / 100)}`);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button disabled={disabled} onClick={() => setOpen(true)}>
        {disabled ? "Aguardando Teste de Mechas" : "Avaliar e gerar orçamento"}
      </Button>
      <QuickCreate
        open={open}
        onOpenChange={setOpen}
        title="Gerar orçamento"
        description="Um item por enquanto — o mesmo fluxo aceita mais itens quando a UI de múltiplos itens for construída."
        onSubmit={handleSubmit}
        loading={saving}
        submitDisabled={!serviceId || amountCents === 0}
      >
        <Field label="Serviço" htmlFor="q-service" required>
          <Combobox id="q-service" options={SERVICE_OPTIONS} value={serviceId} onValueChange={setServiceId} placeholder="Buscar serviço..." />
        </Field>
        <Field label="Valor" htmlFor="q-amount" required hint={selectedService ? `Duração estimada: ${selectedService.durationMinutes} min` : undefined}>
          <CurrencyInput id="q-amount" valueInCents={amountCents} onValueChange={setAmountCents} />
        </Field>
      </QuickCreate>
    </>
  );
}

"use client";

import * as React from "react";
import type { ComboboxOption } from "@/design-system/primitives/combobox";
import { QuickCreate } from "@/design-system/primitives/quick-create";
import { Field } from "@/design-system/primitives/field";
import { Input } from "@/design-system/primitives/input";
import { PhoneInput } from "@/design-system/primitives/br-inputs";
import { toast } from "@/design-system/primitives/toast";
import { NovaConsultaForm } from "./nova-consulta-form";
import { searchCustomersAction, createCustomerQuickAction } from "./actions";

export function NovaConsultaFormWrapper({
  services,
  chemicalServiceIds,
}: {
  services: ComboboxOption[];
  chemicalServiceIds: string[];
}) {
  const [customers, setCustomers] = React.useState<ComboboxOption[]>([]);
  const [quickCreateOpen, setQuickCreateOpen] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newPhone, setNewPhone] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  async function handleSearchCustomer(query: string) {
    const results = await searchCustomersAction(query);
    setCustomers(results.map((c) => ({ value: c.id, label: c.name, description: c.phone })));
  }

  React.useEffect(() => {
    handleSearchCustomer("");
  }, []);

  async function handleQuickCreateSubmit() {
    setCreating(true);
    try {
      const result = await createCustomerQuickAction({ name: newName, phone: newPhone });
      if (!result.ok) {
        toast.error("Não foi possível cadastrar", result.error);
        return;
      }
      setCustomers((prev) => [{ value: result.id, label: result.name, description: result.phone }, ...prev]);
      setQuickCreateOpen(false);
      setNewName("");
      setNewPhone("");
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <NovaConsultaForm
        customers={customers}
        services={services}
        chemicalServiceIds={chemicalServiceIds}
        onSearchCustomer={handleSearchCustomer}
        onCreateCustomer={() => setQuickCreateOpen(true)}
      />

      <QuickCreate
        open={quickCreateOpen}
        onOpenChange={setQuickCreateOpen}
        title="Novo cliente"
        description="Cadastro mínimo — o restante do perfil pode ser completado depois, no módulo Clientes."
        onSubmit={handleQuickCreateSubmit}
        loading={creating}
        submitDisabled={!newName || !newPhone}
      >
        <Field label="Nome completo" htmlFor="qc-name" required>
          <Input id="qc-name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: Ana Paula" />
        </Field>
        <Field label="Telefone" htmlFor="qc-phone" required>
          <PhoneInput id="qc-phone" value={newPhone} onValueChange={({ masked }) => setNewPhone(masked)} />
        </Field>
      </QuickCreate>
    </>
  );
}

"use client";

import * as React from "react";
import { Wallet, History } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/design-system/primitives/card";
import { Button } from "@/design-system/primitives/button";
import { Badge } from "@/design-system/primitives/badge";
import { EmptyState } from "@/design-system/primitives/empty-state";
import { Combobox, type ComboboxOption } from "@/design-system/primitives/combobox";
import { DatePicker } from "@/design-system/primitives/date-picker";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/design-system/primitives/select";
import { Field } from "@/design-system/primitives/field";
import { ConfirmationDialog } from "@/design-system/primitives/confirmation-dialog";
import { toast } from "@/design-system/primitives/toast";
import {
  apurarComissaoDoProfissionalAction,
  pagarComissaoAction,
  listarHistoricoComissoesAction,
  type ApuracaoPreview,
  type CommissionPayoutHistoryItem,
} from "./actions-sprint2";

/** Método de pagamento aceito — derivado da assinatura real de `pagarComissaoAction`,
 *  para nunca divergir da fonte de verdade (Server Action) sem duplicar o literal union aqui. */
type PaymentMethod = Parameters<typeof pagarComissaoAction>[3];

function formatBRL(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

const PROFISSIONAIS: ComboboxOption[] = [
  { value: "p1", label: "Nataly Rodrigues" },
  { value: "p2", label: "Bia Ferreira" },
];

export function ComissoesPanel() {
  const [professionalId, setProfessionalId] = React.useState("");
  const [periodStart, setPeriodStart] = React.useState<Date | undefined>();
  const [periodEnd, setPeriodEnd] = React.useState<Date | undefined>();
  const [method, setMethod] = React.useState<PaymentMethod>("PIX");
  const [preview, setPreview] = React.useState<ApuracaoPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [paying, setPaying] = React.useState(false);
  const [history, setHistory] = React.useState<CommissionPayoutHistoryItem[]>([]);

  React.useEffect(() => {
    listarHistoricoComissoesAction().then(setHistory);
  }, []);

  async function handleApurar() {
    if (!professionalId || !periodStart || !periodEnd) return;
    setLoadingPreview(true);
    const result = await apurarComissaoDoProfissionalAction(professionalId, periodStart, periodEnd);
    setLoadingPreview(false);
    setPreview(result);
  }

  async function handlePagar() {
    if (!professionalId || !periodStart || !periodEnd || !preview) return;
    setPaying(true);
    const result = await pagarComissaoAction(professionalId, periodStart, periodEnd, method);
    setPaying(false);
    setConfirmOpen(false);
    if (!result.ok) return toast.error("Não foi possível pagar", result.error);
    toast.success("Comissão paga", formatBRL(result.totalCents));
    setPreview(null);
    listarHistoricoComissoesAction().then(setHistory);
  }

  return (
    <div className="flex flex-col gap-8">
      <Card padding="lg">
        <CardHeader>
          <div>
            <CardTitle>Apurar comissão</CardTitle>
            <CardDescription>
              Calculada sobre o que foi efetivamente recebido — nunca sobre o valor devido (Commission Trigger Policy: ON_PAYMENT).
            </CardDescription>
          </div>
        </CardHeader>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Field label="Profissional" htmlFor="c-prof">
            <Combobox id="c-prof" options={PROFISSIONAIS} value={professionalId} onValueChange={setProfessionalId} placeholder="Selecionar..." />
          </Field>
          <Field label="Início do período" htmlFor="c-start">
            <DatePicker id="c-start" value={periodStart} onValueChange={setPeriodStart} />
          </Field>
          <Field label="Fim do período" htmlFor="c-end">
            <DatePicker id="c-end" value={periodEnd} onValueChange={setPeriodEnd} />
          </Field>
        </div>
        <Button variant="outline" onClick={handleApurar} loading={loadingPreview} disabled={!professionalId || !periodStart || !periodEnd}>
          Apurar
        </Button>

        {preview && (
          <div className="mt-5 pt-5 border-t border-[var(--border)]">
            {preview.items.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">Nenhuma comissão a pagar neste período.</p>
            ) : (
              <>
                <div className="flex flex-col gap-2 mb-4">
                  {preview.items.map((item) => (
                    <div key={item.transactionId} className="flex justify-between text-sm">
                      <span className="text-[var(--text-secondary)]">Atendimento {item.appointmentId}</span>
                      <span className="text-[var(--text-primary)] tabular-nums">{formatBRL(item.commissionAmountCents)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <p className="font-[var(--font-display)] text-xl text-[var(--text-primary)]">{formatBRL(preview.totalCents)}</p>
                  <div className="flex items-center gap-3">
                    <Select value={method} onValueChange={(value) => setMethod(value as PaymentMethod)}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PIX">Pix</SelectItem>
                        <SelectItem value="TRANSFER">Transferência</SelectItem>
                        <SelectItem value="CASH">Dinheiro</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={() => setConfirmOpen(true)}>
                      <Wallet className="h-4 w-4" /> Pagar comissão
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </Card>

      <div>
        <h2 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-3 flex items-center gap-2">
          <History className="h-4 w-4" /> Histórico de pagamentos
        </h2>
        {history.length === 0 ? (
          <EmptyState size="compact" title="Nenhum pagamento de comissão ainda" />
        ) : (
          <Card padding="none" className="divide-y divide-[var(--border)]">
            {history.map((h) => (
              <div key={h.id} className="flex items-center gap-3 p-4">
                <div className="flex-1">
                  <p className="text-sm text-[var(--text-primary)]">{h.professionalName}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {h.periodStart.toLocaleDateString("pt-BR")} – {h.periodEnd.toLocaleDateString("pt-BR")}
                  </p>
                </div>
                {h.isAdjustment && <Badge variant="warning">Ajuste</Badge>}
                <p className="text-sm font-medium tabular-nums">{formatBRL(h.totalCents)}</p>
              </div>
            ))}
          </Card>
        )}
      </div>

      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirmar pagamento de comissão?"
        description={`Isso registra um CommissionPayout imutável de ${preview ? formatBRL(preview.totalCents) : ""}. Correções futuras exigem um novo registro de ajuste, nunca edição.`}
        confirmLabel="Confirmar pagamento"
        loading={paying}
        onConfirm={handlePagar}
      />
    </div>
  );
}

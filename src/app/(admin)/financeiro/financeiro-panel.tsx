"use client";

import * as React from "react";
import { Plus, MoreHorizontal, AlertCircle } from "lucide-react";
import { Card } from "@/design-system/primitives/card";
import { Badge } from "@/design-system/primitives/badge";
import { Button } from "@/design-system/primitives/button";
import { IconButton } from "@/design-system/primitives/icon-button";
import { EmptyState } from "@/design-system/primitives/empty-state";
import { Skeleton } from "@/design-system/primitives/skeleton";
import { QuickCreate } from "@/design-system/primitives/quick-create";
import { Field } from "@/design-system/primitives/field";
import { Combobox, type ComboboxOption } from "@/design-system/primitives/combobox";
import { CurrencyInput } from "@/design-system/primitives/currency-input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/design-system/primitives/select";
import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem } from "@/design-system/primitives/dropdown";
import { ConfirmationDialog } from "@/design-system/primitives/confirmation-dialog";
import { toast } from "@/design-system/primitives/toast";
import {
  listarTransacoesDoDiaAction,
  listarPendenciasAction,
  listarCategoriasAction,
  registrarRecebimentoAction,
  registrarEstornoAction,
  type TransactionListItem,
  type PendenciaItem,
} from "./actions";

function formatBRL(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

const METHOD_LABEL: Record<string, string> = {
  PIX: "Pix",
  CARD_CREDIT: "Cartão de crédito",
  CARD_DEBIT: "Cartão de débito",
  CASH: "Dinheiro",
  TRANSFER: "Transferência",
};

export function FinanceiroPanel() {
  const [loading, setLoading] = React.useState(true);
  const [transactions, setTransactions] = React.useState<TransactionListItem[]>([]);
  const [pendencias, setPendencias] = React.useState<PendenciaItem[]>([]);
  const [categorias, setCategorias] = React.useState<ComboboxOption[]>([]);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [estornoTarget, setEstornoTarget] = React.useState<TransactionListItem | null>(null);
  const [estornoLoading, setEstornoLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    const [txs, pend, cats] = await Promise.all([
      listarTransacoesDoDiaAction(new Date()),
      listarPendenciasAction(),
      listarCategoriasAction(),
    ]);
    setTransactions(txs);
    setPendencias(pend);
    setCategorias(cats.map((c) => ({ value: c.id, label: c.name })));
    setLoading(false);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const caixaHoje = transactions.reduce((sum, t) => sum + (t.type === "INCOME" ? t.amountCents : -t.amountCents), 0);

  async function handleEstornar() {
    if (!estornoTarget) return;
    setEstornoLoading(true);
    const result = await registrarEstornoAction(estornoTarget.id);
    setEstornoLoading(false);
    setEstornoTarget(null);
    if (!result.ok) return toast.error("Não foi possível estornar");
    toast.success("Estorno registrado");
    load();
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <Card padding="lg" className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">Caixa de hoje</p>
          <p className="font-[var(--font-display)] text-3xl text-[var(--text-primary)] tabular-nums">{formatBRL(caixaHoje)}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Registrar recebimento
        </Button>
      </Card>

      {pendencias.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-3">
            Pendências
          </h2>
          <div className="flex flex-col gap-2">
            {pendencias.map((p) => (
              <Card key={p.appointmentId} padding="md" className="flex items-center gap-3">
                <AlertCircle className="h-4 w-4 text-[var(--warning)] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-primary)]">
                    {p.customerName} — {p.serviceName}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Devido {formatBRL(p.priceCentsSnapshot)}, faltam {formatBRL(p.saldoDevedorCents)}
                  </p>
                </div>
                <Badge variant="warning">Pendente</Badge>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-3">
          Recebimentos de hoje
        </h2>
        {transactions.length === 0 ? (
          <EmptyState title="Nenhum recebimento hoje" description="Registre o primeiro recebimento do dia." />
        ) : (
          <Card padding="none" className="divide-y divide-[var(--border)]">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center gap-3 p-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-primary)] truncate">{t.descriptionSnapshot}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {t.categoryName} · {t.method && METHOD_LABEL[t.method]}
                  </p>
                </div>
                <p className={`text-sm font-medium tabular-nums ${t.type === "INCOME" ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                  {t.type === "INCOME" ? "+" : "-"}
                  {formatBRL(t.amountCents)}
                </p>
                {!t.reversalOfId && (
                  <Dropdown>
                    <DropdownTrigger asChild>
                      <IconButton aria-label="Mais ações" variant="default" size="sm">
                        <MoreHorizontal />
                      </IconButton>
                    </DropdownTrigger>
                    <DropdownContent align="end">
                      <DropdownItem destructive onSelect={() => setEstornoTarget(t)}>
                        Estornar
                      </DropdownItem>
                    </DropdownContent>
                  </Dropdown>
                )}
              </div>
            ))}
          </Card>
        )}
      </div>

      <NovoRecebimentoQuickCreate
        categorias={categorias}
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          setCreateOpen(false);
          load();
        }}
      />

      <ConfirmationDialog
        open={!!estornoTarget}
        onOpenChange={(open) => !open && setEstornoTarget(null)}
        title="Estornar recebimento?"
        description={`Isso registra um novo lançamento de estorno de ${estornoTarget ? formatBRL(estornoTarget.amountCents) : ""} — o recebimento original nunca é editado (Immutable Financial Ledger).`}
        confirmLabel="Estornar"
        destructive
        loading={estornoLoading}
        onConfirm={handleEstornar}
      />
    </div>
  );
}

function NovoRecebimentoQuickCreate({
  categorias,
  open,
  onOpenChange,
  onCreated,
}: {
  categorias: ComboboxOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [categoryId, setCategoryId] = React.useState("");
  const [amountCents, setAmountCents] = React.useState(0);
  const [method, setMethod] = React.useState<string>("PIX");
  const [description, setDescription] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  async function handleSubmit() {
    setSaving(true);
    const result = await registrarRecebimentoAction({
      categoryId,
      amountCents,
      method: method as any,
      descriptionSnapshot: description,
    });
    setSaving(false);
    if (!result.ok) return toast.error("Não foi possível registrar", result.error);
    toast.success("Recebimento registrado");
    setCategoryId("");
    setAmountCents(0);
    setDescription("");
    onCreated();
  }

  return (
    <QuickCreate
      open={open}
      onOpenChange={onOpenChange}
      title="Registrar recebimento"
      onSubmit={handleSubmit}
      loading={saving}
      submitDisabled={!categoryId || amountCents === 0 || !description}
    >
      <Field label="Descrição" htmlFor="f-desc" required>
        <input
          id="f-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex: Bronze Natural — Ana Paula"
          className="h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--surface-card)] px-4 text-sm"
        />
      </Field>
      <Field label="Categoria" htmlFor="f-cat" required>
        <Combobox id="f-cat" options={categorias} value={categoryId} onValueChange={setCategoryId} placeholder="Buscar categoria..." />
      </Field>
      <Field label="Valor" htmlFor="f-amount" required>
        <CurrencyInput id="f-amount" valueInCents={amountCents} onValueChange={setAmountCents} />
      </Field>
      <Field label="Forma de pagamento" htmlFor="f-method" required>
        <Select value={method} onValueChange={setMethod}>
          <SelectTrigger id="f-method">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(METHOD_LABEL).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </QuickCreate>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Plus } from "lucide-react";
import { Input } from "@/design-system/primitives/input";
import { Card } from "@/design-system/primitives/card";
import { Avatar } from "@/design-system/primitives/avatar";
import { Badge } from "@/design-system/primitives/badge";
import { Button } from "@/design-system/primitives/button";
import { Pagination } from "@/design-system/primitives/pagination";
import { EmptyState } from "@/design-system/primitives/empty-state";
import { Skeleton } from "@/design-system/primitives/skeleton";
import { QuickCreate } from "@/design-system/primitives/quick-create";
import { Field } from "@/design-system/primitives/field";
import { PhoneInput } from "@/design-system/primitives/br-inputs";
import { SwitchField } from "@/design-system/primitives/switch";
import { toast } from "@/design-system/primitives/toast";
import { listarClientesAction, cadastrarClienteAction, type ClienteListItem } from "./actions";

const PAGE_SIZE = 10;

export function ClientesList() {
  const [query, setQuery] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [items, setItems] = React.useState<ClienteListItem[]>([]);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [quickCreateOpen, setQuickCreateOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [consent, setConsent] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async (q: string, p: number) => {
    setLoading(true);
    const result = await listarClientesAction({ query: q, page: p, pageSize: PAGE_SIZE });
    setItems(result.items);
    setTotalPages(result.totalPages);
    setLoading(false);
  }, []);

  /**
   * Um único efeito reagindo a [query, page] — corrigido no Domain Validation
   * Report: a versão anterior tinha dois efeitos separados (um para `query`, outro
   * para `page`), e resetar a página *dentro* do efeito de busca disparava os dois
   * na mesma tecla digitada. Agora `query` e `page` mudam juntos, no mesmo handler
   * de evento síncrono (`handleQueryChange`), então um único efeito debounced reage
   * a ambos de uma vez — nunca dois fetches por tecla.
   */
  React.useEffect(() => {
    const timeout = setTimeout(() => load(query, page), 200);
    return () => clearTimeout(timeout);
  }, [query, page, load]);

  function handleQueryChange(value: string) {
    setQuery(value);
    setPage(1);
  }

  async function handleCreate() {
    setSaving(true);
    const result = await cadastrarClienteAction({ name, phone, consent, email: "", instagram: "" });
    setSaving(false);
    if (!result.ok) {
      toast.error("Não foi possível cadastrar", result.error);
      return;
    }
    toast.success("Cliente cadastrado", name);
    setQuickCreateOpen(false);
    setName("");
    setPhone("");
    setConsent(false);
    setPage(1);
    load(query, 1);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Input
          leadingIcon={<Search />}
          placeholder="Buscar por nome ou telefone..."
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          className="flex-1"
        />
        <Button onClick={() => setQuickCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Novo cliente
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4">
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-4 w-48" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Search />}
          title="Nenhum cliente encontrado"
          description={query ? `Nada bateu com "${query}".` : "Cadastre o primeiro cliente para começar."}
          action={<Button variant="outline" onClick={() => setQuickCreateOpen(true)}>Cadastrar cliente</Button>}
        />
      ) : (
        <>
          <Card padding="none" className="divide-y divide-[var(--border)]">
            {items.map((c) => (
              <Link
                key={c.id}
                href={`/clientes/${c.id}`}
                className="flex items-center gap-3 p-4 hover:bg-[var(--surface-sunken)] transition-colors duration-[var(--dur-fast)]"
              >
                <Avatar name={c.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{c.name}</p>
                </div>
                {c.tags.map((t) => (
                  <Badge key={t} variant="brand">{t}</Badge>
                ))}
              </Link>
            ))}
          </Card>
          {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="self-center" />}
        </>
      )}

      <QuickCreate
        open={quickCreateOpen}
        onOpenChange={setQuickCreateOpen}
        title="Novo cliente"
        onSubmit={handleCreate}
        loading={saving}
        submitDisabled={!name || !phone}
      >
        <Field label="Nome completo" htmlFor="c-name" required>
          <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Ana Paula" />
        </Field>
        <Field label="Telefone" htmlFor="c-phone" required>
          <PhoneInput id="c-phone" value={phone} onValueChange={({ masked }) => setPhone(masked)} />
        </Field>
        <SwitchField
          label="Consentimento LGPD"
          description="Cliente autoriza contato para agendamentos e marketing."
          checked={consent}
          onCheckedChange={setConsent}
        />
      </QuickCreate>
    </div>
  );
}

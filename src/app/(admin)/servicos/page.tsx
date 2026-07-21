import Link from "next/link";
import { Breadcrumb } from "@/design-system/primitives/breadcrumb";
import { TopbarSlot } from "@/design-system/workspace/topbar-slot";
import { Card } from "@/design-system/primitives/card";
import { Badge } from "@/design-system/primitives/badge";
import { listarServicosAction, requiresConsultation } from "./actions";
import { resolvePriceStrategy } from "@/modules/services/domain/value-objects";

function formatBRL(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export default async function ServicosPage() {
  const servicos = await listarServicosAction();

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <TopbarSlot>
        <Breadcrumb items={[{ label: "Serviços" }]} linkComponent={Link} />
      </TopbarSlot>
      <div className="mb-8">
        <p className="eyebrow mb-2">Catálogo</p>
        <h1 className="font-[var(--font-display)] text-2xl text-[var(--text-primary)]">Serviços</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Requisitos e preço vêm de atributos do catálogo — nunca do nome do serviço.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {servicos.map((s) => {
          const strategy = resolvePriceStrategy(s.pricingMode, s.price);
          const needsConsultation = requiresConsultation(strategy);
          return (
            <Card key={s.id} padding="md" className="flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)]">{s.name}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {s.category} · {s.durationMinutes} min
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {s.requiresCredential && (
                    <Badge variant="danger" dot>
                      Exige {s.requiresCredential}
                    </Badge>
                  )}
                  {s.requiresStrandTest && <Badge variant="warning">Exige Teste de Mechas</Badge>}
                  {s.recommendedSpecialties.map((sp) => (
                    <Badge key={sp} variant="neutral">
                      Recomendado: {sp}
                    </Badge>
                  ))}
                  {needsConsultation && <Badge variant="brand">Via Consulta</Badge>}
                </div>
              </div>
              <div className="text-right shrink-0">
                {strategy.mode === "FIXED" ? (
                  <p className="text-sm font-medium text-[var(--text-primary)] tabular-nums">
                    {formatBRL(strategy.amountCents)}
                  </p>
                ) : (
                  <p className="text-xs text-[var(--text-muted)]">Sob avaliação</p>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

import Link from "next/link";
import { Breadcrumb } from "@/design-system/primitives/breadcrumb";
import { TopbarSlot } from "@/design-system/workspace/topbar-slot";
import { Card } from "@/design-system/primitives/card";
import { Avatar } from "@/design-system/primitives/avatar";
import { Badge } from "@/design-system/primitives/badge";
import { listarProfissionaisAction } from "./actions";

export default async function ProfissionaisPage() {
  const profissionais = await listarProfissionaisAction();

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <TopbarSlot>
        <Breadcrumb items={[{ label: "Profissionais" }]} linkComponent={Link} />
      </TopbarSlot>
      <div className="mb-8">
        <p className="eyebrow mb-2">Equipe</p>
        <h1 className="font-[var(--font-display)] text-2xl text-[var(--text-primary)]">Profissionais</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Credenciais e especialidades — a origem de cada capacidade, nunca uma marcação solta.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {profissionais.map((p) => (
          <Card key={p.id} padding="md" className="flex items-center gap-4">
            <Avatar name={p.name} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)]">{p.name}</p>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {p.credentials.map((c) => (
                  <Badge key={c} variant="brand" dot>
                    {c}
                  </Badge>
                ))}
                {p.specialties.map((s) => (
                  <Badge key={s} variant="neutral">
                    {s}
                  </Badge>
                ))}
                {p.credentials.length === 0 && p.specialties.length === 0 && (
                  <span className="text-xs text-[var(--text-muted)]">Sem credenciais ou especialidades declaradas</span>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/design-system/primitives/button";
import { Card } from "@/design-system/primitives/card";
import { EmptyState } from "@/design-system/primitives/empty-state";
import { Avatar } from "@/design-system/primitives/avatar";
import { Skeleton } from "@/design-system/primitives/skeleton";
import { Breadcrumb } from "@/design-system/primitives/breadcrumb";
import { TopbarSlot } from "@/design-system/workspace/topbar-slot";
import { ConsultaStatusBadge } from "@/components/patterns/consulta-status-badge";
import { listConsultasAction } from "./actions";

export default function ConsultasPage() {
  return (
    <div className="p-8">
      <TopbarSlot>
        <Breadcrumb items={[{ label: "Consultas" }]} linkComponent={Link} />
      </TopbarSlot>
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="eyebrow mb-2">Consultas</p>
          <h1 className="font-[var(--font-display)] text-2xl text-[var(--text-primary)]">Fila de consultas</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Do primeiro contato até a avaliação da profissional — antes de virar orçamento.
          </p>
        </div>
        <Button asChild>
          <Link href="/consultas/nova">Nova consulta</Link>
        </Button>
      </div>

      <Suspense fallback={<ConsultasSkeleton />}>
        <ConsultasList />
      </Suspense>
    </div>
  );
}

async function ConsultasList() {
  const consultas = await listConsultasAction();

  if (consultas.length === 0) {
    return (
      <EmptyState
        title="Nenhuma consulta pendente"
        description="Assim que um cliente enviar fotos e objetivo pelo WhatsApp, a consulta aparece aqui."
        action={
          <Button asChild variant="outline">
            <Link href="/consultas/nova">Criar consulta manual</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {consultas.map((consulta) => (
        <Link key={consulta.id} href={`/consultas/${consulta.id}`}>
          <Card interactive className="flex items-center gap-4">
            <Avatar name={consulta.customer.name} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)]">{consulta.customer.name}</p>
              <p className="text-sm text-[var(--text-secondary)] truncate">{consulta.objetivoCliente}</p>
            </div>
            <ConsultaStatusBadge status={consulta.status} />
          </Card>
        </Link>
      ))}
    </div>
  );
}

function ConsultasSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-4 rounded-[var(--radius-md)] border border-[var(--border)] p-5">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-64" />
          </div>
          <Skeleton className="h-6 w-28 rounded-[var(--radius-pill)]" />
        </div>
      ))}
    </div>
  );
}

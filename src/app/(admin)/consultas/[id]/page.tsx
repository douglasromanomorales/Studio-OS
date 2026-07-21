import Link from "next/link";
import { Avatar } from "@/design-system/primitives/avatar";
import { Card, CardHeader, CardTitle } from "@/design-system/primitives/card";
import { Badge } from "@/design-system/primitives/badge";
import { Button } from "@/design-system/primitives/button";
import { Breadcrumb } from "@/design-system/primitives/breadcrumb";
import { TopbarSlot } from "@/design-system/workspace/topbar-slot";
import { ConsultaStatusBadge } from "@/components/patterns/consulta-status-badge";
import { GerarOrcamentoButton } from "./gerar-orcamento-button";
import { getConsultaAction } from "../actions";

export default async function ConsultaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const consulta = await getConsultaAction(id);

  return (
    <div className="p-8 max-w-3xl mx-auto flex flex-col gap-6">
      <TopbarSlot>
        <Breadcrumb
          items={[
            { label: "Consultas", href: "/consultas" },
            { label: consulta.customer.name },
          ]}
          linkComponent={Link}
        />
      </TopbarSlot>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={consulta.customer.name} size="lg" />
          <div>
            <h1 className="font-[var(--font-display)] text-xl text-[var(--text-primary)]">
              {consulta.customer.name}
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              {consulta.customer.phone}
            </p>
          </div>
        </div>

        <ConsultaStatusBadge status={consulta.status} />
      </div>

      {consulta.precisaTesteMechas && (
        <Card
          padding="md"
          className="border-[var(--warning)]/30 bg-[var(--warning-subtle)]"
        >
          <p className="text-sm text-[var(--warning)] font-medium">
            Teste de Mechas obrigatório antes de aprovar qualquer orçamento de
            coloração.
          </p>
        </Card>
      )}

      <Card padding="lg">
        <CardHeader>
          <CardTitle>Objetivo da cliente</CardTitle>
        </CardHeader>

        <p className="text-sm text-[var(--text-primary)]">
          {consulta.objetivoCliente}
        </p>

        <div className="flex flex-wrap gap-2 mt-4">
          {consulta.interestedServices.map((s) => (
            <Badge key={s.serviceId} variant="neutral">
              {s.service.name}
            </Badge>
          ))}
        </div>
      </Card>

      <Card padding="lg">
        <CardHeader>
          <CardTitle>Histórico químico</CardTitle>
        </CardHeader>

        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-[var(--text-muted)] text-xs mb-1">
              Já fez química conosco
            </dt>
            <dd className="text-[var(--text-primary)]">
              {consulta.jaFezQuimica ? "Sim" : "Não"}
            </dd>
          </div>

          <div>
            <dt className="text-[var(--text-muted)] text-xs mb-1">
              Alergia conhecida
            </dt>
            <dd className="text-[var(--text-primary)]">
              {consulta.alergiaConhecida ? "Sim" : "Não"}
            </dd>
          </div>
        </dl>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" asChild>
          <Link href="/consultas">Voltar à fila</Link>
        </Button>

        {consulta.status === "AVALIADA" && (
          <GerarOrcamentoButton
            consultaId={consulta.id}
            professionalId="p1"
            disabled={consulta.precisaTesteMechas}
          />
        )}
      </div>
    </div>
  );
}
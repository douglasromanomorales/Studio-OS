import Link from "next/link";
import { Breadcrumb } from "@/design-system/primitives/breadcrumb";
import { TopbarSlot } from "@/design-system/workspace/topbar-slot";
import { NovaConsultaFormWrapper } from "./form-wrapper";

// TODO: substituir pelo catálogo real via tenantDb(orgId).service.findMany quando a
// auth/tenant estiver disponível. Reflete o seed real de src/../prisma/seed.ts.
const SERVICES = [
  { value: "mechas", label: "Mechas (tradicionais, iluminadas e personalizadas)" },
  { value: "correcao-cor", label: "Correção de cor" },
  { value: "coloracao-global", label: "Coloração global" },
  { value: "tonalizacao", label: "Tonalização" },
  { value: "alisamento-loiras", label: "Alisamento seguro para loiras" },
  { value: "bronze-natural", label: "Bronze Natural" },
];

// Serviços que envolvem química de cor — usados pela regra do Teste de Mechas.
const CHEMICAL_SERVICE_IDS = ["mechas", "correcao-cor", "coloracao-global", "tonalizacao"];

export default function NovaConsultaPage() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <TopbarSlot>
        <Breadcrumb items={[{ label: "Consultas", href: "/consultas" }, { label: "Nova consulta" }]} linkComponent={Link} />
      </TopbarSlot>
      <div className="mb-8">
        <p className="eyebrow mb-2">Consultas</p>
        <h1 className="font-[var(--font-display)] text-2xl text-[var(--text-primary)]">Nova consulta</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Registre o primeiro contato — fotos, histórico e objetivo da cliente, antes da avaliação da profissional.
        </p>
      </div>
      <NovaConsultaFormWrapper services={SERVICES} chemicalServiceIds={CHEMICAL_SERVICE_IDS} />
    </div>
  );
}

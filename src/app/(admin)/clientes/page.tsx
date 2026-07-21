import Link from "next/link";
import { Breadcrumb } from "@/design-system/primitives/breadcrumb";
import { TopbarSlot } from "@/design-system/workspace/topbar-slot";
import { ClientesList } from "./clientes-list";

export default function ClientesPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <TopbarSlot>
        <Breadcrumb items={[{ label: "Clientes" }]} linkComponent={Link} />
      </TopbarSlot>
      <div className="mb-8">
        <p className="eyebrow mb-2">Clientes</p>
        <h1 className="font-[var(--font-display)] text-2xl text-[var(--text-primary)]">Clientes</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Cadastro, histórico e relacionamento — a fonte única de verdade sobre quem é cliente da casa.
        </p>
      </div>
      <ClientesList />
    </div>
  );
}

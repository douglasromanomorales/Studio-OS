import Link from "next/link";
import { Breadcrumb } from "@/design-system/primitives/breadcrumb";
import { TopbarSlot } from "@/design-system/workspace/topbar-slot";
import { AgendaGrid } from "./agenda-grid";
import { listarProfissionaisDaGradeAction } from "./actions";

export default async function AgendaPage() {
  const profissionais = await listarProfissionaisDaGradeAction();

  return (
    <div className="flex flex-col h-full">
      <TopbarSlot>
        <Breadcrumb items={[{ label: "Agenda" }]} linkComponent={Link} />
      </TopbarSlot>
      <div className="px-8 pt-8 pb-4">
        <p className="eyebrow mb-2">Hoje</p>
        <h1 className="font-[var(--font-display)] text-2xl text-[var(--text-primary)]">Agenda</h1>
      </div>
      <AgendaGrid profissionais={profissionais} />
    </div>
  );
}

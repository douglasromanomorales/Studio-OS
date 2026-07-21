import Link from "next/link";
import { Breadcrumb } from "@/design-system/primitives/breadcrumb";
import { TopbarSlot } from "@/design-system/workspace/topbar-slot";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/design-system/primitives/tabs";
import { FinanceiroPanel } from "./financeiro-panel";
import { ComissoesPanel } from "./comissoes-panel";


export default function FinanceiroPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <TopbarSlot>
        <Breadcrumb items={[{ label: "Financeiro" }]} linkComponent={Link} />
      </TopbarSlot>
      <div className="mb-8">
        <p className="eyebrow mb-2">Financeiro</p>
        <h1 className="font-[var(--font-display)] text-2xl text-[var(--text-primary)]">Financeiro</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Recebimentos, comissões e caixa — nunca recalcula preço, só registra o que aconteceu com ele.
        </p>
      </div>
      <Tabs defaultValue="recebimentos">
        <TabsList>
          <TabsTrigger value="recebimentos">Recebimentos</TabsTrigger>
          <TabsTrigger value="comissoes">Comissões</TabsTrigger>
        </TabsList>
        <TabsContent value="recebimentos">
          <FinanceiroPanel />
        </TabsContent>
        <TabsContent value="comissoes">
          <ComissoesPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

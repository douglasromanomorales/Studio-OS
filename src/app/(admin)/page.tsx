import { Suspense } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/design-system/primitives/button";
import { Skeleton } from "@/design-system/primitives/skeleton";
import { EmptyState } from "@/design-system/primitives/empty-state";
import { Breadcrumb } from "@/design-system/primitives/breadcrumb";
import { TopbarSlot } from "@/design-system/workspace/topbar-slot";
import { DecisionCard, DecisionBlock } from "@/design-system/patterns/decision-card";
import {
  getAgendaSnapshot,
  getConsultasSnapshot,
  getFinanceiroSnapshot,
  getClientesSnapshot,
  getAIInsights,
} from "./dashboard-data";
import { listarPendenciasAction } from "./financeiro/actions";


function formatBRL(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

/**
 * Operating Center — não uma tela inicial, o centro de operação. Cada bloco responde
 * "o que devo fazer agora?" ou "o que mudou?". Blocos carregam de forma independente
 * (Suspense por seção) — o mais rápido aparece primeiro, nenhum bloco lento segura
 * os outros (Design Language, cap. 17.3).
 */
export default function OperatingCenterPage() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <TopbarSlot>
        <Breadcrumb items={[{ label: "Operating Center" }]} linkComponent={Link} />
      </TopbarSlot>

      <div className="mb-8">
        <h1 className="font-[var(--font-display)] text-2xl text-[var(--text-primary)]">{greeting}, Nataly</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">O estado do negócio agora — e o que fazer com ele.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Suspense fallback={<BlockSkeleton title="Agenda" />}>
          <AgendaBlock />
        </Suspense>
        <Suspense fallback={<BlockSkeleton title="Consultas" />}>
          <ConsultasBlock />
        </Suspense>
        <Suspense fallback={<BlockSkeleton title="Financeiro" />}>
          <FinanceiroBlock />
        </Suspense>
        <Suspense fallback={<BlockSkeleton title="Clientes" />}>
          <ClientesBlock />
        </Suspense>
      </div>

      <div className="mt-8">
        <Suspense fallback={<BlockSkeleton title="Insights" />}>
          <InsightsBlock />
        </Suspense>
      </div>
    </div>
  );
}

async function AgendaBlock() {
  const agenda = await getAgendaSnapshot();
  return (
    <DecisionBlock title="Agenda">
      {agenda.horariosVagosHoje > 0 && (
        <DecisionCard
          tone="opportunity"
          category="Hoje"
          metric={String(agenda.horariosVagosHoje)}
          insight={`Você ainda pode preencher ${agenda.horariosVagosHoje} horários vagos hoje e aumentar o faturamento estimado em ${formatBRL(agenda.receitaEstimadaVagos)}.`}
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/consultas">Ver lista de espera</Link>
            </Button>
          }
        />
      )}
      {agenda.confirmacoesPendentes > 0 && (
        <DecisionCard
          tone="attention"
          metric={String(agenda.confirmacoesPendentes)}
          insight={`${agenda.confirmacoesPendentes} atendimentos de hoje ainda não foram confirmados pelas clientes. Um lembrete agora reduz o risco de no-show.`}
          action={<Button size="sm" variant="outline">Enviar lembretes</Button>}
        />
      )}
      <DecisionCard
        tone="neutral"
        insight={`Próximo atendimento: ${agenda.proximosAtendimentos[0]?.customer} (${agenda.proximosAtendimentos[0]?.service}) às ${agenda.proximosAtendimentos[0]?.time}.`}
      />
    </DecisionBlock>
  );
}

async function ConsultasBlock() {
  const consultas = await getConsultasSnapshot();
  return (
    <DecisionBlock title="Consultas">
      {consultas.aguardandoOrcamentoMais24h > 0 && (
        <DecisionCard
          tone="attention"
          metric={String(consultas.aguardandoOrcamentoMais24h)}
          insight={`${consultas.aguardandoOrcamentoMais24h} consultas aguardam orçamento há mais de 24 horas. Priorize essas clientes para aumentar a conversão.`}
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/consultas">Abrir fila de consultas</Link>
            </Button>
          }
        />
      )}
      {consultas.testesMechasPendentes > 0 && (
        <DecisionCard
          tone="risk"
          metric={String(consultas.testesMechasPendentes)}
          insight={`${consultas.testesMechasPendentes} clientes com orçamento aprovado ainda não fizeram o Teste de Mechas — nenhuma coloração deve ser agendada antes disso.`}
        />
      )}
    </DecisionBlock>
  );
}

async function FinanceiroBlock() {
  const financeiro = await getFinanceiroSnapshot();
  const pendencias = await listarPendenciasAction();
  return (
    <DecisionBlock title="Financeiro">
      <DecisionCard
        tone="positive"
        metric={formatBRL(financeiro.entradasHojeCents)}
        insight="Entradas registradas hoje até agora."
      />
      {pendencias.length > 0 && (
        <DecisionCard
          tone="attention"
          metric={String(pendencias.length)}
          insight={`${pendencias.length} atendimento(s) concluído(s) sem recebimento vinculado. Priorize cobrar antes que vire inadimplência.`}
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/financeiro">Ver pendências</Link>
            </Button>
          }
        />
      )}
      {financeiro.pacotesVencendo7d > 0 && (
        <DecisionCard
          tone="risk"
          metric={String(financeiro.pacotesVencendo7d)}
          insight={`${financeiro.pacotesVencendo7d} pacotes vencem nos próximos 7 dias com sessões não usadas. Avise as clientes antes que expirem — pacote vencido vira frustração, não receita.`}
        />
      )}
    </DecisionBlock>
  );
}

async function ClientesBlock() {
  const clientes = await getClientesSnapshot();
  return (
    <DecisionBlock title="Clientes">
      {clientes.inativosComPadraoDeRetorno > 0 && (
        <DecisionCard
          tone="opportunity"
          metric={String(clientes.inativosComPadraoDeRetorno)}
          insight={`${clientes.inativosComPadraoDeRetorno} clientes costumam retornar neste período e ainda não agendaram. Considere uma campanha de reativação.`}
        />
      )}
      {clientes.aniversariantesSemana.length > 0 && (
        <DecisionCard
          tone="neutral"
          insight={`Aniversariante da semana: ${clientes.aniversariantesSemana[0].name} (${clientes.aniversariantesSemana[0].date}). Uma mensagem pessoal vale mais que qualquer campanha.`}
        />
      )}
    </DecisionBlock>
  );
}

async function InsightsBlock() {
  const insights = await getAIInsights();
  return (
    <DecisionBlock title="Insights inteligentes">
      {insights.length === 0 ? (
        <EmptyState
          size="compact"
          icon={<Sparkles />}
          title="Insights em breve"
          description="Quando o motor de IA entrar em operação, recomendações e alertas gerados a partir dos seus dados aparecem aqui — no mesmo formato dos cards acima."
        />
      ) : (
        insights.map((insight) => (
          <DecisionCard key={insight.id} tone="opportunity" category="IA" insight={insight.body} />
        ))
      )}
    </DecisionBlock>
  );
}

function BlockSkeleton({ title }: { title: string }) {
  return (
    <section aria-label={`${title} — carregando`} className="flex flex-col gap-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-24 rounded-[var(--radius-md)]" />
      <Skeleton className="h-24 rounded-[var(--radius-md)]" />
    </section>
  );
}

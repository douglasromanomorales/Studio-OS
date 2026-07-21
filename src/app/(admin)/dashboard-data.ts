/**
 * Fonte de dados do Operating Center. Cada função aqui vira uma query real
 * (tenantDb) quando a camada de auth/dados entrar — a forma dos retornos já é a
 * forma final, para o Dashboard não precisar mudar quando o mock sair.
 *
 * IMPORTANTE — espaço arquitetural da IA: `getAIInsights()` retorna exatamente a
 * forma do modelo `AIInsight` do schema Prisma (type, título, corpo, dados, status).
 * Quando o motor de insights (cron + IA) nascer, ele só passa a popular essa mesma
 * forma — o Dashboard não muda uma linha. Hoje retorna vazio de propósito: o bloco
 * de IA renderiza um estado vazio honesto, não insights falsos.
 */

export interface AgendaSnapshot {
  proximosAtendimentos: { customer: string; service: string; time: string }[];
  horariosVagosHoje: number;
  receitaEstimadaVagos: number; // em centavos — convenção da plataforma
  confirmacoesPendentes: number;
  cancelamentosHoje: number;
}

export interface ConsultasSnapshot {
  novasHoje: number;
  aguardandoOrcamentoMais24h: number;
  testesMechasPendentes: number;
}

export interface FinanceiroSnapshot {
  entradasHojeCents: number;
  recebimentosPendentes: number;
  pacotesVencendo7d: number;
}

export interface ClientesSnapshot {
  aniversariantesSemana: { name: string; date: string }[];
  inativosComPadraoDeRetorno: number;
}

export interface AIInsight {
  id: string;
  type: "REVENUE" | "INACTIVE_CUSTOMERS" | "SCHEDULE_GAP" | "STOCK" | "CAMPAIGN_SUGGESTION";
  title: string;
  body: string;
  status: "NEW" | "VIEWED" | "DISMISSED" | "ACTED";
}

export async function getAgendaSnapshot(): Promise<AgendaSnapshot> {
  await new Promise((r) => setTimeout(r, 300));
  return {
    proximosAtendimentos: [
      { customer: "Ana Paula Ferreira", service: "Mechas", time: "14:00" },
      { customer: "Julia Mendes", service: "Bronze Natural", time: "15:30" },
    ],
    horariosVagosHoje: 3,
    receitaEstimadaVagos: 78000,
    confirmacoesPendentes: 2,
    cancelamentosHoje: 1,
  };
}

export async function getConsultasSnapshot(): Promise<ConsultasSnapshot> {
  await new Promise((r) => setTimeout(r, 300));
  return { novasHoje: 3, aguardandoOrcamentoMais24h: 4, testesMechasPendentes: 2 };
}

export async function getFinanceiroSnapshot(): Promise<FinanceiroSnapshot> {
  await new Promise((r) => setTimeout(r, 300));
  return { entradasHojeCents: 342000, recebimentosPendentes: 2, pacotesVencendo7d: 3 };
}

export async function getClientesSnapshot(): Promise<ClientesSnapshot> {
  await new Promise((r) => setTimeout(r, 300));
  return {
    aniversariantesSemana: [{ name: "Bianca Souza", date: "18/07" }],
    inativosComPadraoDeRetorno: 12,
  };
}

export async function getAIInsights(): Promise<AIInsight[]> {
  // Vazio de propósito — o motor de insights ainda não existe (item 17 do roadmap).
  return [];
}

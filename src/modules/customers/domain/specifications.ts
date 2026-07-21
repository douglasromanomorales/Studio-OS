import { isBefore, subDays, addDays, isWithinInterval, setYear } from "date-fns";

/**
 * Specifications — estados derivados do Cliente. Nunca persistidos (Temporal Truth
 * + decisão da modelagem: "inativo" depende do padrão de retorno de cada cliente,
 * um status gravado viraria mentira no dia seguinte).
 */

export interface HistoricoRetorno {
  ultimoAtendimento: Date | null;
  /** Intervalo típico de retorno desta cliente, em dias — derivado do histórico dela.
      Enquanto a Agenda não existir para calcular de verdade, o chamador usa a
      heurística documentada no relatório do domínio (média da categoria do serviço). */
  intervaloTipicoDias: number | null;
}

const MARGEM_INATIVIDADE = 1.5; // 50% além do padrão dela = inativa

export function clienteEmRisco(h: HistoricoRetorno, hoje = new Date()): boolean {
  if (!h.ultimoAtendimento || !h.intervaloTipicoDias) return false;
  return isBefore(addDays(h.ultimoAtendimento, h.intervaloTipicoDias), hoje);
}

export function clienteInativo(h: HistoricoRetorno, hoje = new Date()): boolean {
  if (!h.ultimoAtendimento || !h.intervaloTipicoDias) return false;
  return isBefore(addDays(h.ultimoAtendimento, Math.round(h.intervaloTipicoDias * MARGEM_INATIVIDADE)), hoje);
}

export function aniversarianteNoPeriodo(birthDate: Date | null, inicio: Date, fim: Date): boolean {
  if (!birthDate) return false;
  const nesteAno = setYear(birthDate, inicio.getFullYear());
  return isWithinInterval(nesteAno, { start: inicio, end: fim });
}

/** Temporal Truth: teste válido = registro existente, não expirado. */
export function existeTesteMechasValido(
  registros: { performedAt: Date; validUntil: Date | null }[],
  hoje = new Date()
): boolean {
  return registros.some((r) => r.validUntil === null || !isBefore(r.validUntil, hoje));
}

/** Cliente visível em buscas padrão: nem arquivado, nem anonimizado. */
export function clienteVisivel(c: { archivedAt: Date | null; anonymizedAt: Date | null }): boolean {
  return c.archivedAt === null && c.anonymizedAt === null;
}

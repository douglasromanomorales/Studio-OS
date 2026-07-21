/**
 * Platform Discovery em ação: ao escrever isto, a semelhança com `_calendar-grid`
 * (roving tabindex — uma célula focável, setas movem foco) é real, mas a semântica
 * das teclas é invertida (aqui, cima/baixo = horário, esquerda/direita =
 * profissional; no calendário é o oposto) e generalizar exigiria refatorar o
 * consumidor original sem um segundo caso validando a generalização primeiro.
 *
 * Decisão: passo 2 do Platform Discovery, não o 3 — fica local ao módulo Agenda.
 * Vira candidata a promoção no dia em que um terceiro grid aparecer (Estoque? uma
 * planilha de turnos?) e a duplicação for real, não hipotética. Ver Engine Stress
 * Test (cap. 40) — esta decisão é o resultado dele para o par
 * `_calendar-engine`/Agenda: não generaliza ainda.
 */

export interface GridPosition {
  row: number; // índice do slot de horário
  col: number; // índice da coluna de profissional
}

export type GridAction = { type: "move"; row?: number; col?: number } | { type: "select" } | null;

export function interpretAgendaGridKey(key: string): GridAction {
  switch (key) {
    case "ArrowDown":
      return { type: "move", row: 1 };
    case "ArrowUp":
      return { type: "move", row: -1 };
    case "ArrowRight":
      return { type: "move", col: 1 };
    case "ArrowLeft":
      return { type: "move", col: -1 };
    case "Enter":
    case " ":
      return { type: "select" };
    default:
      return null;
  }
}

export function clampPosition(pos: GridPosition, maxRow: number, maxCol: number): GridPosition {
  return {
    row: Math.min(Math.max(0, pos.row), maxRow),
    col: Math.min(Math.max(0, pos.col), maxCol),
  };
}

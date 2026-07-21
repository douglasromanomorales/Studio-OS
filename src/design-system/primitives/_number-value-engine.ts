/**
 * Motor de valor numérico — comportamento puro, ZERO import de React. Corrigido na
 * fase de Platform Hardening: a versão anterior importava React e expunha um hook
 * diretamente daqui, violando o próprio princípio Headless First (seção 19 do Design
 * Language). O padrão correto, já usado pela Upload Engine, é: lógica pura aqui,
 * adaptador de React em arquivo separado (`_use-number-value.ts`).
 */

export interface NumberValueConstraints {
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
}

export function clampToStep(raw: number, { min = -Infinity, max = Infinity, step = 1, precision = 0 }: NumberValueConstraints): number {
  const bounded = Math.min(max, Math.max(min, raw));
  const stepped = step ? Math.round(bounded / step) * step : bounded;
  return Number(stepped.toFixed(precision));
}

export type NumberKeyAction = "increment" | "decrement" | "min" | "max" | null;

/** Interpreta uma tecla em uma ação — recebe string, não KeyboardEvent, para não depender do DOM. */
export function interpretNumberKey(key: string): NumberKeyAction {
  switch (key) {
    case "ArrowUp":
    case "ArrowRight":
      return "increment";
    case "ArrowDown":
    case "ArrowLeft":
      return "decrement";
    case "Home":
      return "min";
    case "End":
      return "max";
    default:
      return null;
  }
}

export function canIncrement(value: number, step: number, max?: number): boolean {
  return max === undefined || value + step <= max;
}

export function canDecrement(value: number, step: number, min?: number): boolean {
  return min === undefined || value - step >= min;
}

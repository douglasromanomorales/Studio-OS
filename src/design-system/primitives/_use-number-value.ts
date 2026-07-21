"use client";

import * as React from "react";
import {
  clampToStep,
  interpretNumberKey,
  canIncrement as pureCanIncrement,
  canDecrement as pureCanDecrement,
  type NumberValueConstraints,
} from "./_number-value-engine";

export type { NumberValueConstraints };

/**
 * Único ponto de contato entre a engine numérica (pura) e React — mesma arquitetura
 * da Upload Engine (`_use-upload-engine.ts`). A engine não importa este arquivo.
 */
export interface UseNumberValueOptions extends NumberValueConstraints {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function useNumberValue({ value, onChange, min, max, step = 1, precision = 0, disabled }: UseNumberValueOptions) {
  const constraints = { min, max, step, precision };

  const setClamped = React.useCallback(
    (raw: number) => {
      if (disabled) return;
      onChange(clampToStep(raw, constraints));
    },
    [onChange, min, max, step, precision, disabled]
  );

  const increment = React.useCallback(() => setClamped(value + step), [setClamped, value, step]);
  const decrement = React.useCallback(() => setClamped(value - step), [setClamped, value, step]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;
    const action = interpretNumberKey(e.key);
    if (!action) return;
    e.preventDefault();
    if (action === "increment") increment();
    else if (action === "decrement") decrement();
    else if (action === "min" && min !== undefined) setClamped(min);
    else if (action === "max" && max !== undefined) setClamped(max);
  }

  return {
    increment,
    decrement,
    setClamped,
    canIncrement: pureCanIncrement(value, step, max),
    canDecrement: pureCanDecrement(value, step, min),
    handleKeyDown,
  };
}

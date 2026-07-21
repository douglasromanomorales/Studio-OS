"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "../lib/cn";
import { clampToStep, type NumberValueConstraints } from "./_number-value-engine";

/**
 * Slider usa Radix Slider para a parte que envolve física de arraste, drag por
 * ponteiro e teclado em um eixo — reimplementar isso por cima da engine numérica
 * seria regressão, não reuso (Radix já resolve isso de forma mais robusta do que
 * vale a pena reconstruir). A engine numérica entra só para arredondamento
 * consistente com NumberInput/Stepper quando o valor é exibido como rótulo.
 */
export interface SliderProps extends NumberValueConstraints {
  value: number;
  onValueChange: (value: number) => void;
  disabled?: boolean;
  /** Mostra o valor atual como rótulo acima do track. */
  showValue?: boolean;
  formatValue?: (value: number) => string;
  className?: string;
  "aria-label": string;
}

export function Slider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  precision = 0,
  disabled,
  showValue = true,
  formatValue,
  className,
  ...props
}: SliderProps) {
  return (
    <div className={cn("w-full", className)}>
      {showValue && (
        <div className="mb-2 text-sm font-medium text-[var(--text-primary)] tabular-nums">
          {formatValue ? formatValue(value) : value}
        </div>
      )}
      <SliderPrimitive.Root
        value={[value]}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onValueChange={([raw]) => onValueChange(clampToStep(raw, { min, max, step, precision }))}
        className="relative flex items-center select-none touch-none h-5"
        aria-label={props["aria-label"]}
      >
        <SliderPrimitive.Track className="relative h-1.5 w-full grow rounded-[var(--radius-pill)] bg-[var(--surface-sunken)]">
          <SliderPrimitive.Range className="absolute h-full rounded-[var(--radius-pill)] bg-[var(--brand)]" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          className={cn(
            "block h-5 w-5 rounded-full bg-[var(--surface-card)] border-2 border-[var(--brand)] shadow-[var(--shadow-sm)]",
            "transition-transform duration-[var(--dur-fast)] ease-[var(--ease-product)] hover:scale-110",
            "focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
            "disabled:pointer-events-none disabled:opacity-50"
          )}
        />
      </SliderPrimitive.Root>
    </div>
  );
}

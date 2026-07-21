import * as React from "react";
import { Plus, Minus } from "lucide-react";
import { cn } from "../lib/cn";
import { useNumberValue, type NumberValueConstraints } from "./_use-number-value";
import { IconButton } from "./icon-button";

export interface StepperProps extends NumberValueConstraints {
  value: number;
  onValueChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
  /** Rótulo lido por leitor de tela (ex: "Sessões do pacote") — Stepper não tem label visível própria, use dentro de um Field. */
  "aria-label": string;
}

/**
 * Stepper é a versão "sem digitação livre" do mesmo comportamento do NumberInput —
 * só +/-, pensado para quantidades pequenas onde digitar é mais lento que clicar
 * (sessões de um pacote, unidades de um produto no estoque).
 */
export function Stepper({
  value,
  onValueChange,
  min,
  max,
  step = 1,
  precision = 0,
  disabled,
  className,
  ...props
}: StepperProps) {
  const engine = useNumberValue({ value, onChange: onValueChange, min, max, step, precision, disabled });

  return (
    <div
      role="spinbutton"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={props["aria-label"]}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={engine.handleKeyDown}
      className={cn(
        "inline-flex items-center gap-3 rounded-[var(--radius-pill)] border border-[var(--border-strong)] px-1 py-1",
        "focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
    >
      <IconButton aria-label="Diminuir" variant="default" size="sm" disabled={!engine.canDecrement} onClick={engine.decrement}>
        <Minus />
      </IconButton>
      <span className="min-w-[2ch] text-center text-sm font-medium text-[var(--text-primary)] tabular-nums">
        {value}
      </span>
      <IconButton aria-label="Aumentar" variant="default" size="sm" disabled={!engine.canIncrement} onClick={engine.increment}>
        <Plus />
      </IconButton>
    </div>
  );
}

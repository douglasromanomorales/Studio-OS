import * as React from "react";
import { Plus, Minus } from "lucide-react";
import { cn } from "../lib/cn";
import { useNumberValue, type NumberValueConstraints } from "./_use-number-value";
import { IconButton } from "./icon-button";

export interface NumberInputProps extends NumberValueConstraints {
  value: number;
  onValueChange: (value: number) => void;
  /** Mostra botões +/- ao lado do campo. Desligado por padrão — nem todo NumberInput precisa (ex: campo de preço com poucos ajustes). */
  showSpinner?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function NumberInput({
  value,
  onValueChange,
  min,
  max,
  step = 1,
  precision = 0,
  showSpinner = false,
  placeholder,
  disabled,
  className,
}: NumberInputProps) {
  const engine = useNumberValue({ value, onChange: onValueChange, min, max, step, precision, disabled });

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {showSpinner && (
        <IconButton
          aria-label="Diminuir"
          variant="outline"
          size="sm"
          disabled={disabled || !engine.canDecrement}
          onClick={engine.decrement}
        >
          <Minus />
        </IconButton>
      )}
      <input
        type="number"
        role="spinbutton"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onKeyDown={engine.handleKeyDown}
        onChange={(e) => {
          const raw = Number(e.target.value);
          if (!Number.isNaN(raw)) engine.setClamped(raw);
        }}
        className={cn(
          "h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--surface-card)]",
          "px-4 text-sm text-[var(--text-primary)] text-center",
          "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
          "transition-[border-color,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-product)]",
          "focus-visible:outline-none focus-visible:border-[var(--brand)] focus-visible:shadow-[var(--shadow-focus)]",
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
      />
      {showSpinner && (
        <IconButton
          aria-label="Aumentar"
          variant="outline"
          size="sm"
          disabled={disabled || !engine.canIncrement}
          onClick={engine.increment}
        >
          <Plus />
        </IconButton>
      )}
    </div>
  );
}

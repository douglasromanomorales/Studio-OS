"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Star } from "lucide-react";
import { cn } from "../lib/cn";

/**
 * Rating não usa _number-value-engine. A identidade ARIA correta de uma avaliação por
 * estrelas é "radiogroup" (escolher exatamente uma opção de um conjunto ordenado,
 * anunciado como "3 de 5"), não "spinbutton". Construído sobre RadioGroupPrimitive —
 * já é dependência do sistema (usado pelo RadioGroup da Onda 2) — em vez de reinventar
 * navegação por teclado que o Radix já resolve para esse padrão.
 */
export interface RatingProps {
  value: number;
  onValueChange: (value: number) => void;
  max?: number;
  disabled?: boolean;
  className?: string;
  "aria-label": string;
}

export function Rating({ value, onValueChange, max = 5, disabled, className, ...props }: RatingProps) {
  const [hovered, setHovered] = React.useState<number | null>(null);

  return (
    <RadioGroupPrimitive.Root
      value={String(value)}
      onValueChange={(v) => onValueChange(Number(v))}
      disabled={disabled}
      aria-label={props["aria-label"]}
      className={cn("inline-flex items-center gap-1", className)}
      onMouseLeave={() => setHovered(null)}
    >
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => {
        const filled = hovered ? star <= hovered : star <= value;
        return (
          <RadioGroupPrimitive.Item
            key={star}
            value={String(star)}
            onMouseEnter={() => setHovered(star)}
            aria-label={`${star} de ${max}`}
            className={cn(
              "rounded-[var(--radius-xs)] transition-transform duration-[var(--dur-fast)] ease-[var(--ease-product)]",
              "focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
              "hover:scale-110 disabled:pointer-events-none disabled:opacity-50"
            )}
          >
            <Star
              className={cn(
                "h-5 w-5 transition-colors duration-[var(--dur-fast)]",
                filled ? "fill-[var(--brand)] text-[var(--brand)]" : "fill-transparent text-[var(--border-strong)]"
              )}
            />
          </RadioGroupPrimitive.Item>
        );
      })}
    </RadioGroupPrimitive.Root>
  );
}

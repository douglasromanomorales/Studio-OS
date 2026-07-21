"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";
import { cn } from "../lib/cn";

export interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  /** Estado visual "indeterminado" (ex: "alguns itens do grupo selecionados"). Não é um valor de formulário. */
  indeterminate?: boolean;
}

export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, indeterminate, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-[18px] w-[18px] shrink-0 rounded-[5px] border border-[var(--border-strong)] bg-[var(--surface-card)]",
      "transition-colors duration-[var(--dur-fast)] ease-[var(--ease-product)]",
      "focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:bg-[var(--brand)] data-[state=checked]:border-[var(--brand)]",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center text-[var(--text-on-brand)]">
      {indeterminate ? <Minus className="h-3 w-3" /> : <Check className="h-3 w-3" />}
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = "Checkbox";

/** Composição comum: checkbox + label clicável, associados por id automático. */
export function CheckboxField({
  label,
  description,
  ...props
}: CheckboxProps & { label: string; description?: string }) {
  const id = React.useId();
  return (
    <div className="flex items-start gap-3">
      <Checkbox id={id} {...props} />
      <label htmlFor={id} className="cursor-pointer select-none">
        <span className="text-sm text-[var(--text-primary)]">{label}</span>
        {description && <p className="text-xs text-[var(--text-secondary)] mt-0.5">{description}</p>}
      </label>
    </div>
  );
}

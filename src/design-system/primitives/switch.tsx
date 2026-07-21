"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "../lib/cn";

export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      "peer inline-flex h-6 w-[42px] shrink-0 items-center rounded-[var(--radius-pill)] border border-transparent",
      "bg-[var(--surface-sunken)] data-[state=checked]:bg-[var(--brand)]",
      "transition-colors duration-[var(--dur-fast)] ease-[var(--ease-product)]",
      "focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        "block h-[18px] w-[18px] translate-x-[3px] rounded-full bg-[var(--surface-card)] shadow-[var(--shadow-xs)]",
        "transition-transform duration-[var(--dur-fast)] ease-[var(--ease-product)]",
        "data-[state=checked]:translate-x-[21px]"
      )}
    />
  </SwitchPrimitive.Root>
));
Switch.displayName = "Switch";

/** Composição: switch + label + descrição — para telas de configuração (ex: "precisa de teste de mechas?"). */
export function SwitchField({
  label,
  description,
  ...props
}: React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> & {
  label: string;
  description?: string;
}) {
  const id = React.useId();
  return (
    <div className="flex items-center justify-between gap-4">
      <label htmlFor={id} className="cursor-pointer select-none">
        <span className="text-sm text-[var(--text-primary)]">{label}</span>
        {description && <p className="text-xs text-[var(--text-secondary)] mt-0.5">{description}</p>}
      </label>
      <Switch id={id} {...props} />
    </div>
  );
}

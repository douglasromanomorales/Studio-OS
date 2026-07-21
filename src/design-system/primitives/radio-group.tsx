"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "../lib/cn";

export const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root ref={ref} className={cn("flex flex-col gap-3", className)} {...props} />
));
RadioGroup.displayName = "RadioGroup";

export const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    className={cn(
      "h-[18px] w-[18px] shrink-0 rounded-full border border-[var(--border-strong)] bg-[var(--surface-card)]",
      "transition-colors duration-[var(--dur-fast)] ease-[var(--ease-product)]",
      "focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:border-[var(--brand)]",
      className
    )}
    {...props}
  >
    <RadioGroupPrimitive.Indicator className="flex items-center justify-center h-full w-full relative after:content-[''] after:h-2 after:w-2 after:rounded-full after:bg-[var(--brand)]" />
  </RadioGroupPrimitive.Item>
));
RadioGroupItem.displayName = "RadioGroupItem";

export function RadioField({
  value,
  label,
  description,
}: {
  value: string;
  label: string;
  description?: string;
}) {
  const id = React.useId();
  return (
    <div className="flex items-start gap-3">
      <RadioGroupItem value={value} id={id} />
      <label htmlFor={id} className="cursor-pointer select-none">
        <span className="text-sm text-[var(--text-primary)]">{label}</span>
        {description && <p className="text-xs text-[var(--text-secondary)] mt-0.5">{description}</p>}
      </label>
    </div>
  );
}

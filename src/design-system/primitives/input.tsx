import * as React from "react";
import { cn } from "../lib/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

/**
 * Input — altura e padding aumentados na revisão (h-11, px-4) em relação à
 * primeira versão (h-10, px-3.5). A diferença de 4px de altura e 6px de
 * padding horizontal é sutil, mas é exatamente esse tipo de folga que separa
 * um campo "genérico" de um campo com sensação premium — comparar lado a
 * lado com um input do Stripe Dashboard ou do Linear para calibrar.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, leadingIcon, trailingIcon, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className="relative">
        {leadingIcon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] [&_svg]:h-4 [&_svg]:w-4">
            {leadingIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={errorId}
          className={cn(
            "h-11 w-full rounded-[var(--radius-sm)] border bg-[var(--surface-card)] px-4 text-sm text-[var(--text-primary)]",
            "border-[var(--border-strong)] placeholder:text-[var(--text-muted)]",
            "transition-[border-color,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-product)]",
            "focus-visible:outline-none focus-visible:border-[var(--brand)] focus-visible:shadow-[var(--shadow-focus)]",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--surface-sunken)]",
            error && "border-[var(--danger)] focus-visible:border-[var(--danger)] focus-visible:shadow-[0_0_0_3px_var(--danger-subtle)]",
            leadingIcon && "pl-10",
            trailingIcon && "pr-10",
            className
          )}
          {...props}
        />
        {trailingIcon && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] [&_svg]:h-4 [&_svg]:w-4">
            {trailingIcon}
          </span>
        )}
        {error && (
          <p id={errorId} role="alert" className="mt-1.5 text-xs text-[var(--danger)]">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

// Field/Label/HelperText/ErrorMessage migraram para ./field.tsx — Input não é mais
// o único controle que precisa deles (Select, DatePicker, MaskedInput também usam).

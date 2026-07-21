import * as React from "react";
import { cn } from "../lib/cn";

/**
 * Field — wrapper de formulário, independente do tipo de controle interno.
 * Qualquer primitivo de Forms (Input, Select, DatePicker, MaskedInput...) se encaixa
 * aqui do mesmo jeito. Field nunca sabe o que está dentro dele.
 */
export interface FieldProps {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Field({ label, htmlFor, hint, error, required, className, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      {children}
      {error ? <ErrorMessage>{error}</ErrorMessage> : hint ? <HelperText>{hint}</HelperText> : null}
    </div>
  );
}

export function Label({
  required,
  className,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label className={cn("text-[13px] font-medium text-[var(--text-primary)]", className)} {...props}>
      {children}
      {required && (
        <span className="text-[var(--brand)] ml-0.5" aria-hidden>
          *
        </span>
      )}
    </label>
  );
}

export function HelperText({ className, children }: { className?: string; children: React.ReactNode }) {
  return <p className={cn("text-xs text-[var(--text-muted)]", className)}>{children}</p>;
}

/**
 * ErrorMessage — sempre role="alert". Usado tanto solto (dentro de Field) quanto
 * standalone (ex: erro de formulário inteiro, não de um campo específico).
 */
export function ErrorMessage({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <p role="alert" className={cn("text-xs text-[var(--danger)]", className)}>
      {children}
    </p>
  );
}

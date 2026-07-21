import * as React from "react";
import { cn } from "../lib/cn";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, id, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id ?? generatedId;
    const errorId = error ? `${textareaId}-error` : undefined;

    return (
      <div>
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={!!error}
          aria-describedby={errorId}
          rows={4}
          className={cn(
            "w-full resize-y rounded-[var(--radius-sm)] border bg-[var(--surface-card)] px-4 py-3 text-sm text-[var(--text-primary)]",
            "border-[var(--border-strong)] placeholder:text-[var(--text-muted)]",
            "transition-[border-color,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-product)]",
            "focus-visible:outline-none focus-visible:border-[var(--brand)] focus-visible:shadow-[var(--shadow-focus)]",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--surface-sunken)]",
            error && "border-[var(--danger)] focus-visible:border-[var(--danger)]",
            className
          )}
          {...props}
        />
        {error && (
          <p id={errorId} role="alert" className="mt-1.5 text-xs text-[var(--danger)]">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

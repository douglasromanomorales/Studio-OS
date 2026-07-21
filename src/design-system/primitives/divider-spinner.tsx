import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../lib/cn";

export function Divider({
  orientation = "horizontal",
  className,
  label,
}: {
  orientation?: "horizontal" | "vertical";
  className?: string;
  /** Texto centralizado sobre a linha (ex: "ou"). Só suportado em orientação horizontal. */
  label?: string;
}) {
  if (label && orientation === "horizontal") {
    return (
      <div className={cn("flex items-center gap-3", className)} role="separator">
        <span className="h-px flex-1 bg-[var(--border)]" />
        <span className="text-xs text-[var(--text-muted)]">{label}</span>
        <span className="h-px flex-1 bg-[var(--border)]" />
      </div>
    );
  }
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        orientation === "horizontal" ? "h-px w-full" : "w-px h-full",
        "bg-[var(--border)]",
        className
      )}
    />
  );
}

const spinnerSizes = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-6 w-6" } as const;

export function Spinner({
  size = "md",
  className,
  label = "Carregando",
}: {
  size?: keyof typeof spinnerSizes;
  className?: string;
  label?: string;
}) {
  return (
    <span role="status" aria-label={label} className="inline-flex">
      <Loader2 className={cn(spinnerSizes[size], "animate-spin text-[var(--text-muted)]", className)} />
    </span>
  );
}

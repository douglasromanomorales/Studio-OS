import * as React from "react";
import { cn } from "../lib/cn";

/**
 * EmptyState v2 — revisão pedida: abandonar o container com borda tracejada
 * (lia como "placeholder de wireframe", não como produto acabado). A versão
 * Linear/Notion não precisa de moldura nenhuma: o espaço em branco generoso
 * ao redor já comunica "isto é um estado, não um erro de layout".
 */
export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** "compact" para dentro de cards/painéis pequenos, "default" para o corpo principal de uma página. */
  size?: "compact" | "default";
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  size = "default",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        size === "default" ? "py-20 px-6" : "py-10 px-4",
        className
      )}
    >
      {icon && (
        <div
          className={cn(
            "mb-5 flex items-center justify-center rounded-full bg-[var(--surface-sunken)] text-[var(--text-muted)]",
            size === "default" ? "h-14 w-14 [&_svg]:h-6 [&_svg]:w-6" : "h-11 w-11 [&_svg]:h-5 [&_svg]:w-5"
          )}
        >
          {icon}
        </div>
      )}
      <h3
        className={cn(
          "font-[var(--font-display)] text-[var(--text-primary)]",
          size === "default" ? "text-xl" : "text-base"
        )}
      >
        {title}
      </h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-[var(--text-secondary)]">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

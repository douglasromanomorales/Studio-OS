import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

/**
 * Badge — indicador de status curto. Neutro de domínio: recebe uma variante
 * semântica, nunca sabe o nome do enum de negócio que a originou.
 *
 * Transição: cor de fundo/texto anima suavemente quando a variante muda em
 * runtime (ex: status de um card mudando de "warning" para "success" após
 * uma ação) — isso é o que faz o estado parecer "vivo" em vez de trocado
 * abruptamente, no espírito Linear.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-2.5 py-1 text-xs font-medium leading-none whitespace-nowrap " +
    "transition-colors duration-[var(--dur-base)] ease-[var(--ease-product)]",
  {
    variants: {
      variant: {
        neutral: "bg-[var(--surface-sunken)] text-[var(--text-secondary)]",
        brand: "bg-[var(--brand-subtle)] text-[var(--brand)]",
        success: "bg-[var(--success-subtle)] text-[var(--success)]",
        warning: "bg-[var(--warning-subtle)] text-[var(--warning)]",
        danger: "bg-[var(--danger-subtle)] text-[var(--danger)]",
        outline: "border border-[var(--border-strong)] text-[var(--text-primary)] bg-transparent",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  /** Anima um leve "pulse" no dot — usar com moderação, só para status que exigem atenção ativa (ex: aguardando resposta). */
  pulse?: boolean;
}

export function Badge({ className, variant, dot, pulse, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span className="relative flex h-1.5 w-1.5" aria-hidden>
          {pulse && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
          )}
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {children}
    </span>
  );
}

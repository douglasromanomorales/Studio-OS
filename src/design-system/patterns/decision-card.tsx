import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";
import { Card } from "../primitives/card";

/**
 * DecisionCard — o conceito central do Operating Center: nunca um número solto,
 * sempre "o que devo fazer agora" ou "o que mudou desde a última vez". Pattern da
 * plataforma (não do Dashboard): o mesmo formato serve Insights de IA, avisos no
 * topo da Agenda e alertas do Financeiro.
 *
 * Anatomia: [tone] + insight (a frase acionável — obrigatória) + metric (contexto
 * numérico opcional) + action (o próximo passo, opcional mas fortemente recomendado
 * — um DecisionCard sem ação deveria justificar por que existe).
 */
const toneStyles = cva("border-l-4", {
  variants: {
    tone: {
      /** Requer ação humana agora (ex: consultas paradas >24h). */
      attention: "border-l-[var(--warning)]",
      /** Oportunidade de ganho (ex: horários vagos preencíveis). */
      opportunity: "border-l-[var(--brand)]",
      /** Risco ativo (ex: pacotes vencendo sem uso, cancelamento em cascata). */
      risk: "border-l-[var(--danger)]",
      /** Informação de estado, sem urgência (ex: resumo do dia). */
      neutral: "border-l-[var(--border-strong)]",
      /** Confirmação positiva (ex: meta do dia atingida). */
      positive: "border-l-[var(--success)]",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export interface DecisionCardProps extends VariantProps<typeof toneStyles> {
  /** A frase acionável — o coração do card. Nunca só um rótulo de métrica. */
  insight: string;
  /** Rótulo curto de contexto (ex: "Consultas", "Agenda de hoje"). */
  category?: string;
  /** Número de destaque opcional — contexto, nunca o protagonista. */
  metric?: string;
  /** O próximo passo. Recebe um Button/Link já montado por quem consome. */
  action?: React.ReactNode;
  className?: string;
}

export function DecisionCard({ insight, category, metric, action, tone, className }: DecisionCardProps) {
  return (
    <Card padding="md" className={cn(toneStyles({ tone }), "flex items-start gap-4", className)}>
      {metric && (
        <span className="font-[var(--font-display)] text-2xl text-[var(--text-primary)] leading-none tabular-nums shrink-0 pt-0.5">
          {metric}
        </span>
      )}
      <div className="flex-1 min-w-0">
        {category && (
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)] mb-1">{category}</p>
        )}
        <p className="text-sm text-[var(--text-primary)] leading-relaxed">{insight}</p>
        {action && <div className="mt-3">{action}</div>}
      </div>
    </Card>
  );
}

/** Agrupador de DecisionCards por bloco de decisão (Agenda, Consultas, Financeiro...). */
export function DecisionBlock({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section aria-label={title} className={cn("flex flex-col gap-3", className)}>
      <h2 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide">{title}</h2>
      {children}
    </section>
  );
}

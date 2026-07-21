import { Badge } from "@/design-system/primitives/badge";

type ConsultaStatus = "AGUARDANDO_AVALIACAO" | "AVALIADA" | "CONVERTIDA_ORCAMENTO" | "ARQUIVADA";

const STATUS_MAP: Record<ConsultaStatus, { label: string; variant: "warning" | "brand" | "success" | "neutral"; pulse?: boolean }> = {
  AGUARDANDO_AVALIACAO: { label: "Aguardando avaliação", variant: "warning", pulse: true },
  AVALIADA: { label: "Avaliada", variant: "brand" },
  CONVERTIDA_ORCAMENTO: { label: "Orçamento gerado", variant: "success" },
  ARQUIVADA: { label: "Arquivada", variant: "neutral" },
};

/**
 * Pattern (camada de domínio, não Primitive) — exemplo canônico da hierarquia do
 * Design Language: Button → AppointmentStatusBadge. Este é o equivalente para
 * Consultas. Fica em studio-os/src/components/patterns porque conhece o enum
 * ConsultaStatus, que a camada de design system (`src/design-system`) nunca deveria conhecer.
 */
export function ConsultaStatusBadge({ status }: { status: ConsultaStatus }) {
  const config = STATUS_MAP[status];
  return (
    <Badge variant={config.variant} dot pulse={config.pulse}>
      {config.label}
    </Badge>
  );
}

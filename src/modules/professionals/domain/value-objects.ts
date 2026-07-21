/**
 * Value Objects do domínio Profissional — funções puras, mesmo padrão do domínio
 * Cliente e das engines da plataforma.
 */

/** VO CorAgenda — hex válido + contraste mínimo AA quando usada como fundo com texto branco. */
export function validarCorAgenda(hex: string): { valid: boolean; reason?: string } {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return { valid: false, reason: "Cor precisa ser um hex válido (#RRGGBB)" };
  if (contrastRatioAgainstWhite(hex) < 3) {
    return { valid: false, reason: "Cor muito clara — texto branco da agenda ficaria ilegível sobre ela" };
  }
  return { valid: true };
}

function contrastRatioAgainstWhite(hex: string): number {
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(1 + i, 3 + i), 16) / 255);
  const lum = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const L = 0.2126 * lum(r) + 0.7152 * lum(g) + 0.0722 * lum(b);
  return (1.0 + 0.05) / (L + 0.05);
}

/** Cor determinística por nome — mesmo padrão de fallback do Avatar da plataforma. */
const PALETTE = ["#B85A3D", "#4A5D8A", "#5D8A6B", "#8A5D7C", "#8A7C5D", "#5D7C8A"];
export function corAgendaPadrao(name: string): string {
  const hash = Array.from(name).reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return PALETTE[hash % PALETTE.length];
}

/** VO ComissaoBase — percentual limitado a [0, 100]. */
export function validarComissao(percent: number): { valid: boolean; reason?: string } {
  if (percent < 0 || percent > 100) return { valid: false, reason: "Comissão deve estar entre 0% e 100%" };
  return { valid: true };
}

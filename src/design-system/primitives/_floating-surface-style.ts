/**
 * Classe de estilo compartilhada — não é uma engine, não é um shell de componente,
 * é a string de aparência (borda/sombra/radius/animação) que Popover Shell e Dropdown
 * precisam igual, apesar de serem construídos sobre primitivas Radix diferentes
 * (Popover vs. DropdownMenu, que têm semântica ARIA distinta e não compartilham
 * componente React). Extraído aqui para não duplicar a mesma string de classes duas
 * vezes — duplicação real de aparência, não de comportamento.
 */
export const floatingSurfaceClass =
  "z-50 overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] " +
  "bg-[var(--surface-card)] shadow-[var(--shadow-md)] " +
  "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 " +
  "data-[state=closed]:animate-out data-[state=closed]:fade-out-0";

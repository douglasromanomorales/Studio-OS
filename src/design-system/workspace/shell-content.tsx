import { cn } from "../lib/cn";

/**
 * Content Layer — não importa nada de ShellSidebar/ShellTopbar, nunca vai importar.
 * `id="shell-content"` + `tabIndex={-1}` são o alvo do skip-link do ShellRoot —
 * ativar o link move o foco de teclado direto para cá, pulando toda a navegação.
 */
export function ShellContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <main id="shell-content" tabIndex={-1} className={cn("flex-1 overflow-y-auto focus:outline-none", className)}>
      {children}
    </main>
  );
}

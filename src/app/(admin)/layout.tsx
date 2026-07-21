"use client";
import type { CommandPaletteItem } from "@/design-system/primitives/command-palette";
import { WorkspaceProvider } from "@/design-system/workspace/workspace-provider";
import { ShellRoot } from "@/design-system/workspace/shell-root";
import { ShellSidebar } from "@/design-system/workspace/shell-sidebar";
import { ShellTopbar } from "@/design-system/workspace/shell-topbar";
import { ShellContent } from "@/design-system/workspace/shell-content";
import { ErrorBoundary, LoadingBoundary } from "@/design-system/workspace/shell-feedback";
import { AdminNav } from "./admin-nav";
import { AdminTopbarRight } from "./admin-topbar-right";

// TODO: substituir por dado real de sessão (organização logada, usuário) quando a
// camada de auth entrar no roadmap. Reflete o seed real (Casa Nataly Rodrigues).
const commandPaletteItems: CommandPaletteItem[] = [
  { id: "dashboard", label: "Ir para Dashboard", group: "Navegar", onSelect: () => (window.location.href = "/") },
  { id: "agenda", label: "Ir para Agenda", group: "Navegar", onSelect: () => (window.location.href = "/agenda") },
  { id: "consultas", label: "Ir para Consultas", group: "Navegar", onSelect: () => (window.location.href = "/consultas") },
  { id: "clientes", label: "Ir para Clientes", group: "Navegar", onSelect: () => (window.location.href = "/clientes") },
  { id: "financeiro", label: "Ir para Financeiro", group: "Navegar", onSelect: () => (window.location.href = "/financeiro") },
  { id: "nova-consulta", label: "Nova consulta", group: "Ações", shortcut: "N", onSelect: () => (window.location.href = "/consultas/nova") },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider config={{ theme: "casa-nataly", commandPaletteItems }}>
      <ShellRoot>
        <ShellSidebar
          header={<div className="px-2 py-1 text-sm font-medium text-[var(--text-primary)]">Casa Nataly Rodrigues</div>}
        >
          <AdminNav />
        </ShellSidebar>
        <div className="flex flex-1 flex-col min-w-0">
          <ShellTopbar right={<AdminTopbarRight />} />
          <ShellContent>
            <ErrorBoundary>
              <LoadingBoundary>{children}</LoadingBoundary>
            </ErrorBoundary>
          </ShellContent>
        </div>
      </ShellRoot>
    </WorkspaceProvider>
  );
}

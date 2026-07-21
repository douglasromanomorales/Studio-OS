"use client";

import * as React from "react";
import { ThemeProvider } from "./theme-provider";
import { Toaster } from "../primitives/toast";
import type { CommandPaletteItem } from "../primitives/command-palette";
import { CommandPalette } from "../primitives/command-palette";

export interface WorkspaceConfig {
  theme: string;
  commandPaletteItems?: CommandPaletteItem[];
}

/**
 * Ponto de composição único do Workspace: Theme Engine + Feedback Layer (Toaster) +
 * Overlay Layer (Command Palette) montados uma vez na raiz. `ShellRoot`/`ShellSidebar`/
 * `ShellTopbar`/`ShellContent` continuam sendo montados pelo produto dentro deste
 * provider — o WorkspaceProvider não decide o layout, só o que precisa existir
 * globalmente uma única vez, não importa o layout escolhido por cima.
 *
 * Reutilização entre produtos CodeChain: trocar de Studio OS para Sofia IA é trocar
 * `config.theme` e `config.commandPaletteItems` — nenhuma peça do Workspace em si
 * muda.
 */
export function WorkspaceProvider({ config, children }: { config: WorkspaceConfig; children: React.ReactNode }) {
  return (
    <ThemeProvider theme={config.theme}>
      {children}
      {config.commandPaletteItems && <CommandPalette items={config.commandPaletteItems} />}
      <Toaster />
    </ThemeProvider>
  );
}

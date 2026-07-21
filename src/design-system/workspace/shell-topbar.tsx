"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import { cn } from "../lib/cn";
import { useShell } from "./_shell-context";
import { IconButton } from "../primitives/icon-button";

export interface ShellTopbarProps {
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}

export function ShellTopbar({ left, center, right, className }: ShellTopbarProps) {
  const { isMobile, setMobileNavOpen, topbarLeft } = useShell();

  return (
    <header
      className={cn(
        "h-14 shrink-0 border-b border-[var(--border)] bg-[var(--surface-card)] flex items-center gap-3 px-4",
        className
      )}
    >
      {isMobile && (
        <IconButton aria-label="Abrir navegação" variant="default" size="sm" onClick={() => setMobileNavOpen(true)}>
          <Menu />
        </IconButton>
      )}
      <div className="flex items-center gap-3 min-w-0 flex-1">{left ?? topbarLeft}</div>
      {center && <div className="flex items-center justify-center flex-1">{center}</div>}
      <div className="flex items-center gap-2 shrink-0">{right}</div>
    </header>
  );
}

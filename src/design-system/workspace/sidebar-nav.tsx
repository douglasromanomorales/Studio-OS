"use client";

import * as React from "react";
import { cn } from "../lib/cn";
import { useShell } from "./_shell-context";
import { SimpleTooltip } from "../primitives/tooltip";
import { Badge } from "../primitives/badge";

export interface SidebarNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  active?: boolean;
  badge?: string | number;
}

export interface SidebarNavSection {
  label?: string;
  items: SidebarNavItem[];
}

export interface SidebarNavProps {
  sections: SidebarNavSection[];
  linkComponent?: React.ComponentType<{ href: string; className?: string; children: React.ReactNode }>;
}

const DefaultLink = ({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) => (
  <a href={href} className={className}>
    {children}
  </a>
);

/**
 * Recebe uma lista de seções/itens genérica — nunca sabe que existe "Agenda" ou
 * "Consultas". Quem monta essa lista com nomes reais é o Studio OS (ou qualquer
 * outro produto CodeChain), no ponto de composição do Workspace.
 */
export function SidebarNav({ sections, linkComponent: Link = DefaultLink }: SidebarNavProps) {
  const { sidebarCollapsed } = useShell();

  return (
    <div className="flex flex-col gap-5">
      {sections.map((section, i) => (
        <div key={i} className="flex flex-col gap-0.5">
          {section.label && !sidebarCollapsed && (
            <p className="px-2.5 mb-1 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
              {section.label}
            </p>
          )}
          {section.items.map((item) => {
            const link = (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 text-sm font-medium",
                  "transition-colors duration-[var(--dur-fast)] ease-[var(--ease-product)]",
                  "focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
                  item.active
                    ? "bg-[var(--brand-subtle)] text-[var(--brand)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-primary)]",
                  sidebarCollapsed && "justify-center px-0"
                )}
              >
                <span className="shrink-0 [&_svg]:h-[18px] [&_svg]:w-[18px]" aria-hidden>
                  {item.icon}
                </span>
                {!sidebarCollapsed && <span className="truncate flex-1">{item.label}</span>}
                {!sidebarCollapsed && item.badge !== undefined && (
                  <Badge variant="brand" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
            return sidebarCollapsed ? (
              <SimpleTooltip key={item.id} label={item.label}>
                {link}
              </SimpleTooltip>
            ) : (
              link
            );
          })}
        </div>
      ))}
    </div>
  );
}

"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const avatarVariants = cva("relative flex shrink-0 overflow-hidden rounded-full", {
  variants: {
    size: {
      xs: "h-6 w-6 text-[10px]",
      sm: "h-8 w-8 text-xs",
      md: "h-10 w-10 text-sm",
      lg: "h-12 w-12 text-base",
    },
  },
  defaultVariants: { size: "md" },
});

export interface AvatarProps extends VariantProps<typeof avatarVariants> {
  src?: string | null;
  /** Nome completo — usado para gerar iniciais e a cor de fundo determinística do fallback. */
  name: string;
  className?: string;
}

/** Gera uma das 6 cores de fallback de forma determinística a partir do nome — mesma pessoa, mesma cor sempre. */
function fallbackTone(name: string) {
  const tones = [
    "bg-[var(--brand-subtle)] text-[var(--brand)]",
    "bg-emerald-500/12 text-emerald-700",
    "bg-blue-500/12 text-blue-700",
    "bg-violet-500/12 text-violet-700",
    "bg-amber-500/14 text-amber-700",
    "bg-rose-500/12 text-rose-700",
  ];
  const hash = Array.from(name).reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return tones[hash % tones.length];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

export function Avatar({ src, name, size, className }: AvatarProps) {
  return (
    <AvatarPrimitive.Root className={cn(avatarVariants({ size }), className)}>
      <AvatarPrimitive.Image src={src ?? undefined} alt={name} className="h-full w-full object-cover" />
      <AvatarPrimitive.Fallback
        className={cn("flex h-full w-full items-center justify-center font-medium", fallbackTone(name))}
        delayMs={src ? 400 : 0}
      >
        {initials(name)}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}

/** Grupo de avatares sobrepostos — ex: "3 profissionais atenderam este cliente". */
export function AvatarGroup({ people, max = 4 }: { people: { name: string; src?: string | null }[]; max?: number }) {
  const visible = people.slice(0, max);
  const overflow = people.length - visible.length;
  return (
    <div className="flex items-center -space-x-2">
      {visible.map((p, i) => (
        <div key={i} className="ring-2 ring-[var(--surface-card)] rounded-full">
          <Avatar name={p.name} src={p.src} size="sm" />
        </div>
      ))}
      {overflow > 0 && (
        <div className="h-8 w-8 rounded-full ring-2 ring-[var(--surface-card)] bg-[var(--surface-sunken)] text-[var(--text-secondary)] text-xs font-medium flex items-center justify-center">
          +{overflow}
        </div>
      )}
    </div>
  );
}

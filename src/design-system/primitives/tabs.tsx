"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "../lib/cn";

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-[var(--surface-sunken)] p-1",
        className
      )}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "rounded-[var(--radius-xs)] px-3.5 py-1.5 text-sm font-medium text-[var(--text-secondary)]",
        "transition-colors duration-[var(--dur-fast)] ease-[var(--ease-product)]",
        "focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
        "data-[state=active]:bg-[var(--surface-card)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:shadow-[var(--shadow-xs)]",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn("mt-4 focus-visible:outline-none", className)}
      {...props}
    />
  );
}

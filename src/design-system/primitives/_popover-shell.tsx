"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "../lib/cn";
import { floatingSurfaceClass } from "./_floating-surface-style";

export const PopoverRoot = PopoverPrimitive.Root;
export const PopoverAnchor = PopoverPrimitive.Anchor;
export const PopoverTriggerPrimitive = PopoverPrimitive.Trigger;

export function PopoverShellContent({
  className,
  children,
  matchTriggerWidth = false,
  ...props
}: React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & { matchTriggerWidth?: boolean }) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align="start"
        sideOffset={6}
        className={cn(floatingSurfaceClass, matchTriggerWidth && "w-[var(--radix-popover-trigger-width)]", className)}
        {...props}
      >
        {children}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
}

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const iconButtonVariants = cva(
  "inline-flex items-center justify-center shrink-0 transition-colors duration-[var(--dur-fast)] ease-[var(--ease-product)] " +
    "disabled:pointer-events-none disabled:opacity-50 " +
    "focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
  {
    variants: {
      variant: {
        default: "text-[var(--text-primary)] hover:bg-[var(--surface-sunken)]",
        outline: "border border-[var(--border-strong)] text-[var(--text-primary)] hover:bg-[var(--surface-sunken)]",
        solid: "bg-[var(--brand)] text-[var(--text-on-brand)] hover:bg-[var(--brand-hover)]",
      },
      size: {
        sm: "h-8 w-8 rounded-[var(--radius-xs)] [&_svg]:h-4 [&_svg]:w-4",
        md: "h-10 w-10 rounded-[var(--radius-sm)] [&_svg]:h-[18px] [&_svg]:w-[18px]",
        lg: "h-11 w-11 rounded-full [&_svg]:h-5 [&_svg]:w-5",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  }
);

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  "aria-label": string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(iconButtonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
IconButton.displayName = "IconButton";

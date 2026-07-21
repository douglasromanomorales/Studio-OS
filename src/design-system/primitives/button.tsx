import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "../lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium select-none transition-[background-color,border-color,color,transform] duration-[var(--dur-fast)] ease-[var(--ease-product)] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
  {
    variants: {
      variant: {
        primary: "bg-[var(--brand)] text-[var(--text-on-brand)] hover:bg-[var(--brand-hover)] active:bg-[var(--brand-active)]",
        secondary: "bg-[var(--text-primary)] text-[var(--surface-page)] hover:opacity-90",
        outline: "border border-[var(--border-strong)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--surface-sunken)]",
        ghost: "bg-transparent text-[var(--text-primary)] hover:bg-[var(--surface-sunken)]",
        destructive: "bg-[var(--danger)] text-white hover:opacity-90",
        link: "text-[var(--brand)] underline-offset-4 hover:underline p-0 h-auto font-normal",
      },
      size: {
        sm: "h-8 px-3 text-[13px] rounded-[var(--radius-xs)]",
        md: "h-10 px-4 text-sm rounded-[var(--radius-sm)]",
        lg: "h-11 px-6 text-[15px] rounded-[var(--radius-sm)]",
        icon: "h-10 w-10 rounded-[var(--radius-sm)]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
     
        {children}
      </Comp>
    );
  }
);

Button.displayName = "Button";
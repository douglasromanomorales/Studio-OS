import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

/**
 * Card — superfície de agrupamento. Referência: Stripe Dashboard.
 * A separação do fundo vem quase inteiramente da sombra (--shadow-xs/sm),
 * não da cor — em telas claras, cor de fundo quase igual ao page já basta
 * para "flutuar" visualmente quando combinada com sombra sutil + borda 1px.
 */
const cardVariants = cva(
  "bg-[var(--surface-card)] border border-[var(--border)] rounded-[var(--radius-md)]",
  {
    variants: {
      elevation: {
        flat: "shadow-none",
        subtle: "shadow-[var(--shadow-xs)]",
        raised: "shadow-[var(--shadow-sm)]",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        md: "p-5",
        lg: "p-6",
      },
      interactive: {
        true: "transition-shadow duration-[var(--dur-fast)] ease-[var(--ease-product)] hover:shadow-[var(--shadow-sm)] cursor-pointer",
        false: "",
      },
    },
    defaultVariants: { elevation: "subtle", padding: "md", interactive: false },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, elevation, padding, interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ elevation, padding, interactive }), className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-start justify-between gap-4 mb-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("font-[var(--font-display)] text-[17px] text-[var(--text-primary)]", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-[var(--text-secondary)] mt-1", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center justify-end gap-2 mt-5 pt-4 border-t border-[var(--border)]", className)}
      {...props}
    />
  );
}

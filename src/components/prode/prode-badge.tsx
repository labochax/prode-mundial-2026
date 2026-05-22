import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const prodeBadgeVariants = cva(
  "prode-frame inline-flex min-h-8 items-center px-2 py-1 font-technical text-xs font-bold uppercase",
  {
    variants: {
      variant: {
        ink: "bg-prode-black text-prode-yellow",
        primary: "bg-prode-yellow text-prode-black",
        surface: "bg-prode-surface text-prode-black",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  },
);

type ProdeBadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof prodeBadgeVariants>;

export function ProdeBadge({
  className,
  variant,
  ...props
}: ProdeBadgeProps) {
  return (
    <span
      className={cn(prodeBadgeVariants({ className, variant }))}
      data-slot="prode-badge"
      {...props}
    />
  );
}

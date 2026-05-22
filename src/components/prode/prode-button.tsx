import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const prodeButtonVariants = cva(
  "prode-frame prode-hard-shadow prode-pressable inline-flex min-h-12 items-center justify-center gap-2 px-4 py-3 font-technical text-sm font-bold uppercase text-prode-black outline-none focus-visible:ring-[3px] focus-visible:ring-prode-black focus-visible:ring-offset-[3px] focus-visible:ring-offset-prode-paper disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        ink: "bg-prode-black text-prode-yellow",
        primary: "bg-prode-yellow hover:bg-[#e9f200]",
        surface: "bg-prode-surface hover:bg-[#fff7b5]",
      },
      size: {
        default: "min-h-12 px-4 py-3",
        large: "min-h-14 px-5 py-4 text-base",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "primary",
    },
  },
);

type ProdeButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof prodeButtonVariants>;

export function ProdeButton({
  className,
  size,
  type = "button",
  variant,
  ...props
}: ProdeButtonProps) {
  return (
    <button
      className={cn(prodeButtonVariants({ className, size, variant }))}
      data-slot="prode-button"
      type={type}
      {...props}
    />
  );
}

export { prodeButtonVariants };

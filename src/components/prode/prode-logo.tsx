import * as React from "react";

import { cn } from "@/lib/utils";

type ProdeLogoProps = React.ComponentProps<"div">;

export function ProdeLogo({ className, ...props }: ProdeLogoProps) {
  return (
    <div
      aria-label="Prode 2026"
      className={cn(
        "relative isolate inline-flex max-w-full items-center gap-3 text-prode-black sm:gap-5",
        className,
      )}
      data-slot="prode-logo"
      {...props}
    >
      <span
        aria-hidden="true"
        className="relative hidden size-20 shrink-0 sm:block md:size-24"
      >
        <span className="prode-frame absolute left-[-18px] top-4 h-4 w-12 -skew-x-12 bg-prode-yellow" />
        <span className="prode-frame absolute left-[-8px] top-12 h-3 w-10 -skew-x-12 bg-prode-surface" />
        <span className="prode-hard-shadow absolute inset-0 overflow-hidden rounded-full border-[3px] border-prode-black bg-prode-yellow">
          <span className="absolute -top-3 left-[25%] h-[calc(100%+24px)] w-[46%] rotate-12 border-x-[3px] border-prode-black bg-prode-surface" />
          <span className="absolute left-[-18%] top-[38%] h-[28%] w-[136%] -rotate-12 border-y-[3px] border-prode-black bg-prode-yellow" />
        </span>
      </span>

      <span className="flex min-w-0 flex-col items-start uppercase leading-none">
        <span className="font-display text-6xl leading-none text-prode-black sm:text-7xl md:text-8xl">
          Prode
        </span>
        <span className="prode-frame -mt-1 bg-prode-yellow px-2 pb-1 pt-2 font-display text-4xl leading-none sm:text-5xl md:text-6xl">
          2026
        </span>
      </span>
    </div>
  );
}

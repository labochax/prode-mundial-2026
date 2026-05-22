import * as React from "react";

import { cn } from "@/lib/utils";

type GridTextureProps = React.ComponentProps<"div">;

export function GridTexture({ className, ...props }: GridTextureProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 prode-grid-texture", className)}
      data-slot="grid-texture"
      {...props}
    />
  );
}

import * as React from "react";

import { cn } from "@/lib/utils";

type ScanlineOverlayProps = React.ComponentProps<"div">;

export function ScanlineOverlay({
  className,
  ...props
}: ScanlineOverlayProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 prode-scanlines", className)}
      data-slot="scanline-overlay"
      {...props}
    />
  );
}

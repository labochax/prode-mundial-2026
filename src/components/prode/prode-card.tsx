import * as React from "react";

import { cn } from "@/lib/utils";

type ProdeCardProps = React.ComponentProps<"div">;

export function ProdeCard({ className, ...props }: ProdeCardProps) {
  return (
    <div
      className={cn(
        "prode-frame prode-hard-shadow bg-prode-surface text-prode-black",
        className,
      )}
      data-slot="prode-card"
      {...props}
    />
  );
}

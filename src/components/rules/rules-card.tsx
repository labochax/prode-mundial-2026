import type { ReactNode } from "react";

import { ProdeBadge } from "@/components/prode/prode-badge";
import { ProdeCard } from "@/components/prode/prode-card";
import { cn } from "@/lib/utils";

type RulesCardProps = {
  children: ReactNode;
  className?: string;
  eyebrow: string;
  title: string;
};

export function RulesCard({
  children,
  className,
  eyebrow,
  title,
}: RulesCardProps) {
  return (
    <ProdeCard className={cn("p-5 sm:p-6", className)}>
      <ProdeBadge variant="primary">{eyebrow}</ProdeBadge>
      <h2 className="mt-4 font-display text-3xl uppercase leading-none sm:text-4xl">
        {title}
      </h2>
      <div className="mt-4 text-base leading-7 text-muted-foreground">
        {children}
      </div>
    </ProdeCard>
  );
}

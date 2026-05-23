import { Ticket } from "lucide-react";

import { ProdeBadge } from "@/components/prode/prode-badge";
import { cn } from "@/lib/utils";

type PrizeCardProps = {
  className?: string;
  rewardFor: string;
  seat?: string;
  title: string;
};

export function PrizeCard({
  className,
  rewardFor,
  seat,
  title,
}: PrizeCardProps) {
  return (
    <article
      className={cn(
        "prode-frame prode-hard-shadow relative overflow-hidden bg-prode-surface p-5 text-prode-black sm:p-6",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="absolute -right-8 -top-8 size-28 rotate-12 border-[3px] border-prode-black bg-prode-yellow opacity-80"
      />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <ProdeBadge variant="ink">Premio fantasma</ProdeBadge>
        <Ticket aria-hidden="true" className="size-7 shrink-0 stroke-[3]" />
      </div>

      <h2 className="relative z-10 mt-5 font-display text-3xl uppercase leading-none sm:text-4xl">
        {title}
      </h2>

      <dl className="relative z-10 mt-5 grid gap-3 font-technical text-sm font-bold uppercase">
        {seat && (
          <div className="prode-frame bg-[#f7f4df] p-3">
            <dt className="text-xs text-muted-foreground">Ubicación</dt>
            <dd className="mt-1 text-prode-black">{seat}</dd>
          </div>
        )}
        <div className="prode-frame bg-prode-yellow p-3">
          <dt className="text-xs text-muted-foreground">Se entrega por</dt>
          <dd className="mt-1 text-prode-black">{rewardFor}</dd>
        </div>
      </dl>
    </article>
  );
}

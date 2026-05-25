import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ProdeBadge } from "@/components/prode/prode-badge";
import type { PredictionMatch } from "@/lib/matches/prediction-match";

type MatchDetailToolbarProps = {
  match: PredictionMatch;
};

export function MatchDetailToolbar({ match }: MatchDetailToolbarProps) {
  return (
    <section className="flex flex-col gap-5 border-b-[3px] border-prode-black pb-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-3">
          <Link
            className="prode-frame prode-pressable inline-flex min-h-11 items-center gap-2 bg-prode-surface px-3 py-2 font-technical text-sm font-bold uppercase text-prode-black outline-none focus-visible:ring-[3px] focus-visible:ring-prode-black focus-visible:ring-offset-[3px] focus-visible:ring-offset-prode-paper"
            href="/dashboard"
          >
            <ArrowLeft aria-hidden="true" className="size-5 stroke-[3]" />
            Volver
          </Link>

          <div>
            <div className="flex flex-wrap gap-2">
              <ProdeBadge className="shadow-[2px_2px_0_var(--prode-black)]">
                {match.groupLabel}
              </ProdeBadge>
              <ProdeBadge
                className="shadow-[2px_2px_0_var(--prode-black)]"
                variant={match.status.tone === "live" ? "primary" : "surface"}
              >
                {[match.status.label, match.status.minuteLabel]
                  .filter(Boolean)
                  .join(" ")}
              </ProdeBadge>
              {match.status.scoreLabel && (
                <ProdeBadge
                  className="shadow-[2px_2px_0_var(--prode-black)]"
                  variant="ink"
                >
                  {match.status.scoreLabel}
                </ProdeBadge>
              )}
            </div>
            <h1 className="mt-3 max-w-full font-display text-4xl uppercase leading-none min-[430px]:text-5xl sm:text-6xl">
              Ingresar
              <br className="sm:hidden" />
              <span className="sm:ml-3">Predicción</span>
            </h1>
          </div>
        </div>

        <div className="w-fit">
          <p className="font-technical text-xs font-bold uppercase text-muted-foreground">
            Bloqueo del partido
          </p>
          <div className="prode-frame mt-1 bg-prode-surface px-3 py-2 font-technical text-lg font-black uppercase shadow-[4px_4px_0_var(--prode-black)]">
            {match.detail.timerLabel}
          </div>
        </div>
      </div>
    </section>
  );
}

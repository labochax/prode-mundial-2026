import { TrendingUp } from "lucide-react";

import type { MatchPredictionStats } from "@/lib/matches/match-prediction-stats";
import type { PredictionMatch } from "@/lib/matches/prediction-match";

type MatchTendencyStripProps = {
  match: PredictionMatch;
  stats?: MatchPredictionStats;
};

export function MatchTendencyStrip({ match, stats }: MatchTendencyStripProps) {
  const tendency = stats?.distribution ?? match.tendency.distribution;
  const status = stats?.status ?? match.tendency.status;

  if (!tendency) {
    return (
      <div className="flex min-w-0 flex-1 items-center gap-2 text-muted-foreground">
        <TrendingUp aria-hidden="true" className="size-4 shrink-0" />
        <div className="min-w-0">
          <p className="font-technical text-[0.68rem] font-bold uppercase">
            {status === "hidden-until-lock"
              ? "Tendencia disponible al cierre"
              : "Todavía no hay suficientes pronósticos"}
          </p>
          {status === "insufficient" &&
            typeof stats?.totalPredictions === "number" && (
              <p className="font-technical text-[0.6rem] font-bold uppercase text-muted-foreground">
                Basado en {stats.totalPredictions}{" "}
                {stats.totalPredictions === 1 ? "pronóstico" : "pronósticos"}
              </p>
            )}
        </div>
      </div>
    );
  }

  const { away, draw, home } = tendency;

  return (
    <div className="min-w-0 flex-1">
      <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
        <TrendingUp aria-hidden="true" className="size-4 shrink-0" />
        <span className="truncate font-technical text-[0.68rem] font-bold uppercase">
          Tendencia: {match.home.code} {home}% / EMP {draw}% /{" "}
          {match.away.code} {away}%
        </span>
      </div>

      <div
        aria-hidden="true"
        className="mt-2 flex h-2 overflow-hidden border-[2px] border-prode-black bg-prode-surface"
      >
        <span className="bg-prode-yellow" style={{ width: `${home}%` }} />
        <span className="bg-prode-black" style={{ width: `${draw}%` }} />
        <span className="bg-[#e5e3ce]" style={{ width: `${away}%` }} />
      </div>
    </div>
  );
}

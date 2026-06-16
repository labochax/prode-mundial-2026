import type {
  PlayerVisiblePrediction,
  PlayerVisiblePredictionBadgeTone,
} from "@/lib/supabase/queries/player-visible-predictions";
import { cn } from "@/lib/utils";

type PlayerVisiblePredictionsSectionProps = {
  predictions: PlayerVisiblePrediction[];
};

const BUENOS_AIRES_TIME_ZONE = "America/Argentina/Buenos_Aires";

const badgeToneClassName: Record<PlayerVisiblePredictionBadgeTone, string> = {
  closed: "bg-prode-surface text-prode-black",
  exact: "bg-prode-yellow text-prode-black",
  miss: "bg-[#ffe2d8] text-red-800",
  outcome: "bg-[#f7f4df] text-prode-black",
};

function formatKickoff(kickoffAt: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    timeZone: BUENOS_AIRES_TIME_ZONE,
  }).format(new Date(kickoffAt));
}

function formatMatchLabel(prediction: PlayerVisiblePrediction) {
  if (!prediction.matchNumber) {
    return prediction.stageLabel;
  }

  return `Partido ${prediction.matchNumber} · ${prediction.stageLabel}`;
}

function formatPredictionScore(prediction: PlayerVisiblePrediction) {
  return `${prediction.homeTeamCode} ${prediction.homeScore} - ${prediction.awayScore} ${prediction.awayTeamCode}`;
}

function formatFinalScore(prediction: PlayerVisiblePrediction) {
  if (
    typeof prediction.finalHomeScore !== "number" ||
    typeof prediction.finalAwayScore !== "number"
  ) {
    return null;
  }

  return `${prediction.homeTeamCode} ${prediction.finalHomeScore} - ${prediction.finalAwayScore} ${prediction.awayTeamCode}`;
}

export function PlayerVisiblePredictionsSection({
  predictions,
}: PlayerVisiblePredictionsSectionProps) {
  return (
    <section className="prode-frame prode-hard-shadow bg-prode-surface p-5 sm:p-6">
      <div className="flex flex-col gap-3 border-b-[3px] border-prode-black pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="prode-frame bg-prode-yellow px-3 py-2 font-technical text-xs font-black uppercase">
            Fair play
          </span>
          <h2 className="mt-4 font-display text-5xl uppercase leading-none">
            Predicciones visibles
          </h2>
          <p className="mt-2 font-body text-sm leading-6 text-muted-foreground">
            Solo partidos cerrados o finalizados.
          </p>
        </div>
        <span className="prode-frame bg-[#f7f4df] px-3 py-2 font-technical text-xs font-black uppercase">
          {predictions.length}{" "}
          {predictions.length === 1 ? "predicción" : "predicciones"}
        </span>
      </div>

      {predictions.length === 0 ? (
        <p className="mt-5 border-[3px] border-dashed border-prode-black p-4 font-technical text-xs font-bold uppercase text-muted-foreground">
          Todavía no hay predicciones visibles para este jugador.
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {predictions.map((prediction) => {
            const finalScore = formatFinalScore(prediction);

            return (
              <article
                className="prode-frame bg-[#f7f4df] p-4"
                key={prediction.predictionId}
              >
                <header className="flex flex-col gap-2 border-b-[3px] border-prode-black pb-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-technical text-[0.68rem] font-black uppercase text-muted-foreground">
                      {formatMatchLabel(prediction)}
                    </p>
                    <p className="mt-1 font-technical text-[0.68rem] font-bold uppercase text-muted-foreground">
                      {formatKickoff(prediction.kickoffAt)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "prode-frame inline-flex w-fit px-3 py-1 font-technical text-[0.68rem] font-black uppercase",
                      badgeToneClassName[prediction.badge.tone],
                    )}
                  >
                    {prediction.badge.label}
                  </span>
                </header>

                <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
                  <p className="min-w-0 break-words font-technical text-sm font-black uppercase">
                    {prediction.homeTeamName}
                  </p>
                  <p className="prode-frame bg-white px-3 py-2 text-center font-display text-3xl uppercase leading-none">
                    {prediction.homeScore} - {prediction.awayScore}
                  </p>
                  <p className="min-w-0 break-words font-technical text-sm font-black uppercase sm:text-right">
                    {prediction.awayTeamName}
                  </p>
                </div>

                <div className="mt-4 grid gap-2 font-technical text-[0.68rem] font-bold uppercase text-muted-foreground sm:grid-cols-2">
                  <p>Pronóstico: {formatPredictionScore(prediction)}</p>
                  {finalScore ? <p>Final: {finalScore}</p> : <p>Cerrado</p>}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

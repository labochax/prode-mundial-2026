"use client";

import { Check, Save } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { MatchTendencyStrip } from "@/components/dashboard/match-tendency-strip";
import { ScoreStepper } from "@/components/dashboard/score-stepper";
import type { MockMatch, MockTeam } from "@/lib/mock/matches";
import { cn } from "@/lib/utils";

type MatchPredictionCardProps = {
  match: MockMatch;
};

type TeamColumnProps = {
  score: number;
  team: MockTeam;
  onScoreChange: (value: number) => void;
};

function TeamColumn({ onScoreChange, score, team }: TeamColumnProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-3">
      <div className="prode-frame flex size-16 items-center justify-center overflow-hidden bg-prode-surface sm:size-20">
        {team.flag ? (
          <Image
            alt={team.flag.alt}
            className="size-full object-cover"
            height={team.flag.height}
            sizes="(max-width: 640px) 4rem, 5rem"
            src={team.flag.src}
            width={team.flag.width}
          />
        ) : (
          <span className="font-technical text-xl font-black uppercase">
            {team.code}
          </span>
        )}
      </div>

      <h2 className="min-h-10 max-w-28 text-center font-editorial text-lg font-bold leading-tight text-prode-black">
        {team.name}
      </h2>

      <ScoreStepper
        label={team.name}
        onChange={onScoreChange}
        value={score}
      />
    </div>
  );
}

export function MatchPredictionCard({ match }: MatchPredictionCardProps) {
  const reduceMotion = useReducedMotion();
  const [prediction, setPrediction] = useState(match.initialPrediction);
  const [isSaved, setIsSaved] = useState(match.initialState === "saved");

  const updateScore = (side: "away" | "home", value: number) => {
    setPrediction((current) => ({ ...current, [side]: value }));
    setIsSaved(false);
  };

  return (
    <motion.article
      className="prode-frame prode-hard-shadow relative flex min-h-[27rem] flex-col overflow-hidden bg-prode-surface text-prode-black"
      layout={!reduceMotion}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.18 }}
    >
      <div
        className={cn(
          "prode-frame absolute right-0 top-0 z-10 border-r-0 border-t-0 px-3 py-1 font-technical text-xs font-bold uppercase",
          match.timeLabel.startsWith("Hoy") ? "bg-prode-yellow" : "bg-white",
        )}
      >
        {match.timeLabel}
      </div>

      <div className="flex flex-1 flex-col justify-center gap-5 px-4 pb-5 pt-12 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <p className="font-technical text-xs font-bold uppercase text-muted-foreground">
            {match.groupLabel}
          </p>
          <p className="font-technical text-[0.68rem] font-bold uppercase text-muted-foreground">
            {match.lockLabel}
          </p>
        </div>

        <div className="flex items-start justify-between gap-3 sm:gap-5">
          <TeamColumn
            onScoreChange={(value) => updateScore("home", value)}
            score={prediction.home}
            team={match.home}
          />

          <div className="flex min-h-44 shrink-0 items-center pt-10">
            <span className="font-display text-3xl uppercase text-muted-foreground">
              VS
            </span>
          </div>

          <TeamColumn
            onScoreChange={(value) => updateScore("away", value)}
            score={prediction.away}
            team={match.away}
          />
        </div>
      </div>

      <footer className="border-t-[3px] border-prode-black bg-[#f7f4df] p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <MatchTendencyStrip match={match} />

          <div className="flex shrink-0 items-center gap-3">
            <button
              aria-label={
                isSaved ? "Predicción guardada" : "Guardar predicción rápida"
              }
              className={cn(
                "prode-frame prode-pressable flex size-12 items-center justify-center bg-prode-surface text-prode-black outline-none focus-visible:ring-[3px] focus-visible:ring-prode-black focus-visible:ring-offset-[3px] focus-visible:ring-offset-prode-paper",
                isSaved && "prode-hard-shadow bg-prode-black text-prode-yellow",
              )}
              onClick={() => setIsSaved(true)}
              type="button"
            >
              {isSaved ? (
                <Check aria-hidden="true" className="size-5" />
              ) : (
                <Save aria-hidden="true" className="size-5" />
              )}
            </button>

            <Link
              className="prode-frame prode-hard-shadow prode-pressable inline-flex min-h-12 items-center justify-center bg-prode-yellow px-4 py-3 font-technical text-xs font-bold uppercase text-prode-black outline-none focus-visible:ring-[3px] focus-visible:ring-prode-black focus-visible:ring-offset-[3px] focus-visible:ring-offset-prode-paper"
              href={`/partidos/${match.id}`}
            >
              Ver detalles
            </Link>
          </div>
        </div>
      </footer>
    </motion.article>
  );
}

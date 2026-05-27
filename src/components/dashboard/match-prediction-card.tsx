"use client";

import { Check, CheckCheck, Save, X } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";

import type { SavePredictionActionState } from "@/app/actions/predictions";
import { MatchTendencyStrip } from "@/components/dashboard/match-tendency-strip";
import { ScoreStepper } from "@/components/dashboard/score-stepper";
import type {
  PredictionMatch,
  PredictionMatchTeam,
} from "@/lib/matches/prediction-match";
import { cn } from "@/lib/utils";

type MatchPredictionCardProps = {
  hideIndividualSave?: boolean;
  isDirty?: boolean;
  match: PredictionMatch;
  onPredictionChange?: (
    matchId: string,
    prediction: {
      away: number;
      home: number;
    },
  ) => void;
  prediction?: {
    away: number;
    home: number;
  };
  saveAction: (
    previousState: SavePredictionActionState,
    formData: FormData,
  ) => Promise<SavePredictionActionState>;
  stageHeading: string;
  stageMarker: string;
};

type TeamColumnProps = {
  disabled?: boolean;
  score: number;
  team: PredictionMatchTeam;
  onScoreChange: (value: number) => void;
};

const initialActionState = {
  message: null,
  status: "idle",
} as const satisfies SavePredictionActionState;

const statusClassName = {
  finished: "bg-prode-black text-prode-yellow",
  live: "bg-prode-yellow text-prode-black",
  scheduled: "bg-prode-surface text-prode-black",
  stopped: "bg-[#ffe2d8] text-red-800",
} as const;

const pointsToneClassName = {
  exact: "bg-prode-yellow text-prode-black",
  miss: "bg-[#ffe2d8] text-red-800",
  outcome: "bg-prode-surface text-prode-black",
} as const;

function MatchPointsBreakdown({ match }: { match: PredictionMatch }) {
  const breakdown = match.pointsBreakdown;

  if (!breakdown) {
    return null;
  }

  const Icon =
    breakdown.tone === "exact"
      ? CheckCheck
      : breakdown.tone === "outcome"
        ? Check
        : X;

  return (
    <div className="prode-frame mb-4 grid gap-2 bg-white px-3 py-3 sm:grid-cols-[auto_1fr] sm:items-center">
      <span
        className={cn(
          "prode-frame inline-flex w-fit items-center gap-2 px-3 py-1 font-technical text-xs font-black uppercase",
          pointsToneClassName[breakdown.tone],
        )}
      >
        <Icon aria-hidden="true" className="size-4" />
        {breakdown.shortLabel}
      </span>
      <span className="font-technical text-[0.68rem] font-bold uppercase text-muted-foreground">
        Tu pronóstico: {breakdown.predictionScoreLabel} / Final:{" "}
        {breakdown.actualScoreLabel}
      </span>
    </div>
  );
}

function MatchUnavailableNotice({ match }: { match: PredictionMatch }) {
  if (match.availability.canPredict) {
    return null;
  }

  return (
    <div className="prode-frame mb-4 bg-prode-yellow px-3 py-3">
      <p className="font-technical text-xs font-black uppercase">
        {match.availability.notice}
      </p>
      {match.availability.helper && (
        <p className="mt-2 font-body text-sm leading-5">
          {match.availability.helper}
        </p>
      )}
      {match.availability.ctaHref && match.availability.ctaLabel && (
        <Link
          className="prode-frame prode-pressable mt-3 inline-flex min-h-10 items-center justify-center bg-prode-surface px-3 py-2 font-technical text-xs font-black uppercase text-prode-black outline-none focus-visible:ring-[3px] focus-visible:ring-prode-black focus-visible:ring-offset-[3px] focus-visible:ring-offset-prode-paper"
          href={match.availability.ctaHref}
        >
          {match.availability.ctaLabel}
        </Link>
      )}
    </div>
  );
}

function TeamColumn({ disabled, onScoreChange, score, team }: TeamColumnProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-3">
      <div className="prode-frame flex size-16 items-center justify-center overflow-hidden bg-prode-surface sm:size-20">
        {team.badgeUrl ? (
          <img
            alt={`Escudo de ${team.name}`}
            className="size-full object-contain p-1"
            loading="lazy"
            referrerPolicy="no-referrer"
            src={team.badgeUrl}
          />
        ) : team.flag ? (
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
        disabled={disabled}
        label={team.name}
        onChange={onScoreChange}
        value={score}
      />
    </div>
  );
}

export function MatchPredictionCard({
  hideIndividualSave,
  isDirty,
  match,
  onPredictionChange,
  prediction: controlledPrediction,
  saveAction,
  stageHeading,
  stageMarker,
}: MatchPredictionCardProps) {
  const reduceMotion = useReducedMotion();
  const [actionState, formAction, isPending] = useActionState(
    saveAction,
    initialActionState,
  );
  const [localPrediction, setLocalPrediction] = useState(match.initialPrediction);
  const [isSaved, setIsSaved] = useState(match.initialState === "saved");
  const isPredictionDisabled = match.locked || !match.availability.canPredict;
  const prediction = controlledPrediction ?? localPrediction;
  const isBatchMode = Boolean(hideIndividualSave && onPredictionChange);

  const updateScore = (side: "away" | "home", value: number) => {
    const nextPrediction = {
      ...prediction,
      [side]: value,
    };

    if (onPredictionChange) {
      onPredictionChange(match.id, nextPrediction);
    } else {
      setLocalPrediction(nextPrediction);
    }

    setIsSaved(false);
  };

  useEffect(() => {
    if (actionState.status === "success") {
      setIsSaved(true);
    }
  }, [actionState.status]);

  return (
    <motion.article
      className="prode-frame prode-hard-shadow relative flex min-h-[27rem] flex-col overflow-hidden bg-prode-surface text-prode-black"
      layout={!reduceMotion}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.18 }}
    >
      <div
        className={cn(
          "prode-frame absolute right-0 top-0 z-10 max-w-40 border-r-0 border-t-0 px-4 py-2 text-center font-technical text-sm font-black uppercase leading-tight sm:text-base",
          match.timeLabel.startsWith("Hoy") ? "bg-prode-yellow" : "bg-white",
        )}
      >
        {match.timeLabel}
      </div>

      <div
        aria-label={`${stageHeading}: ${stageMarker}`}
        className="prode-frame absolute left-0 top-0 z-10 flex min-h-16 min-w-16 items-center justify-center border-l-0 border-t-0 bg-prode-yellow px-4 py-2"
      >
        <span className="font-display text-4xl uppercase leading-none sm:text-5xl">
          {stageMarker}
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-center gap-5 px-4 pb-5 pt-20 sm:px-6">
        {(match.status.tone !== "scheduled" || match.status.scoreLabel) && (
          <div className="flex min-h-8 items-center justify-center gap-2">
            {match.status.tone !== "scheduled" && (
              <span
                className={cn(
                  "prode-frame px-3 py-1 font-technical text-xs font-bold uppercase",
                  statusClassName[match.status.tone],
                )}
              >
                {[match.status.label, match.status.minuteLabel]
                  .filter(Boolean)
                  .join(" ")}
              </span>
            )}
            {match.status.scoreLabel && (
              <span className="prode-frame bg-[#f7f4df] px-3 py-1 font-technical text-xs font-black uppercase">
                {match.status.scoreLabel}
              </span>
            )}
          </div>
        )}

        <div className="flex items-start justify-between gap-3 sm:gap-5">
          <TeamColumn
            disabled={isPredictionDisabled}
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
            disabled={isPredictionDisabled}
            onScoreChange={(value) => updateScore("away", value)}
            score={prediction.away}
            team={match.away}
          />
        </div>
      </div>

      <footer className="border-t-[3px] border-prode-black bg-[#f7f4df] p-4">
        {isBatchMode && isDirty && (
          <div className="prode-frame mb-4 inline-flex bg-[#ff4b3e] px-3 py-2 font-technical text-[0.68rem] font-black uppercase text-prode-black shadow-[4px_4px_0_var(--prode-black)]">
            Sin guardar
          </div>
        )}

        <MatchUnavailableNotice match={match} />
        <MatchPointsBreakdown match={match} />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <MatchTendencyStrip match={match} />

          <form action={formAction} className="flex shrink-0 items-center gap-3">
            {!hideIndividualSave && (
              <>
                <input name="match_id" type="hidden" value={match.id} />
                <input
                  name="predicted_home_score"
                  type="hidden"
                  value={prediction.home}
                />
                <input
                  name="predicted_away_score"
                  type="hidden"
                  value={prediction.away}
                />
                <button
                  aria-label={
                    isSaved ? "Predicción guardada" : "Guardar predicción rápida"
                  }
                  className={cn(
                    "prode-frame prode-pressable flex size-12 items-center justify-center bg-prode-surface text-prode-black outline-none focus-visible:ring-[3px] focus-visible:ring-prode-black focus-visible:ring-offset-[3px] focus-visible:ring-offset-prode-paper",
                    isSaved && "prode-hard-shadow bg-prode-black text-prode-yellow",
                  )}
                  disabled={isPending || isPredictionDisabled}
                  type="submit"
                >
                  {isSaved ? (
                    <Check aria-hidden="true" className="size-5" />
                  ) : (
                    <Save aria-hidden="true" className="size-5" />
                  )}
                </button>
              </>
            )}

            <Link
              className="prode-frame prode-hard-shadow prode-pressable inline-flex min-h-12 items-center justify-center bg-prode-yellow px-4 py-3 font-technical text-xs font-bold uppercase text-prode-black outline-none focus-visible:ring-[3px] focus-visible:ring-prode-black focus-visible:ring-offset-[3px] focus-visible:ring-offset-prode-paper"
              href={`/partidos/${match.id}`}
              prefetch={false}
            >
              Ver detalles
            </Link>
          </form>
        </div>

        {((match.locked && match.availability.canPredict) ||
          actionState.message) && (
          <p
            className={cn(
              "mt-3 font-technical text-[0.68rem] font-bold uppercase",
              actionState.status === "error"
                ? "text-red-700"
                : "text-muted-foreground",
            )}
          >
            {match.locked
              ? "Partido cerrado: solo podés ver tu predicción."
              : actionState.message}
          </p>
        )}
      </footer>
    </motion.article>
  );
}

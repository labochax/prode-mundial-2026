"use client";

import { ArrowRight, Check, CheckCheck, Save, X } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";

import type { SavePredictionActionState } from "@/app/actions/predictions";
import {
  QuickPickButtons,
  type QuickPickValue,
} from "@/components/match-detail/quick-pick-buttons";
import { ProdeButton } from "@/components/prode/prode-button";
import { ScoreStepper } from "@/components/dashboard/score-stepper";
import type {
  PredictionMatch,
  PredictionMatchTeam,
} from "@/lib/matches/prediction-match";
import type { StitchFlagAsset } from "@/lib/design/stitch-assets";
import { generateQuickPickScore } from "@/lib/scoring/quick-picks";
import { cn } from "@/lib/utils";

type PredictionCanvasProps = {
  match: PredictionMatch;
  nextMatchHref: string;
  nextMatchLabel: string;
  saveAction: (
    previousState: SavePredictionActionState,
    formData: FormData,
  ) => Promise<SavePredictionActionState>;
};

type TeamPredictionBlockProps = {
  disabled?: boolean;
  label: string;
  onScoreChange: (value: number) => void;
  score: number;
  team: PredictionMatchTeam;
};

const initialActionState = {
  message: null,
  status: "idle",
} as const satisfies SavePredictionActionState;

const pointsToneClassName = {
  exact: "bg-prode-yellow text-prode-black",
  miss: "bg-[#ffe2d8] text-red-800",
  outcome: "bg-prode-surface text-prode-black",
} as const;

function getDisplayFlag(team: PredictionMatchTeam): StitchFlagAsset | undefined {
  return team.detailFlag ?? team.flag;
}

function TeamPredictionBlock({
  disabled,
  label,
  onScoreChange,
  score,
  team,
}: TeamPredictionBlockProps) {
  const flag = getDisplayFlag(team);

  return (
    <div className="flex w-full flex-1 flex-col items-center">
      <div className="prode-frame prode-hard-shadow mb-4 flex size-24 items-center justify-center overflow-hidden bg-[#f1efd9] sm:size-32">
        {flag ? (
          <Image
            alt={flag.alt}
            className="size-full object-cover"
            height={flag.height}
            priority
            sizes="(max-width: 640px) 6rem, 8rem"
            src={flag.src}
            width={flag.width}
          />
        ) : (
          <span className="font-technical text-2xl font-black uppercase sm:text-3xl">
            {team.code}
          </span>
        )}
      </div>

      <h2 className="w-full break-words text-center font-display text-4xl uppercase leading-none sm:text-5xl">
        {team.name}
      </h2>
      <p className="mt-2 font-technical text-xs font-bold uppercase text-muted-foreground">
        {label}
      </p>

      <div className="mt-6">
        <ScoreStepper
          disabled={disabled}
          label={team.name}
          onChange={onScoreChange}
          size="large"
          value={score}
        />
      </div>
    </div>
  );
}

function MatchDetailPointsPanel({ match }: { match: PredictionMatch }) {
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
    <section className="prode-frame prode-hard-shadow bg-[#f7f4df] p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-technical text-xs font-black uppercase text-muted-foreground">
            Puntos obtenidos
          </p>
          <div
            className={cn(
              "prode-frame mt-2 inline-flex items-center gap-2 px-4 py-2 font-display text-4xl uppercase leading-none",
              pointsToneClassName[breakdown.tone],
            )}
          >
            <Icon aria-hidden="true" className="size-6" />
            +{breakdown.points}
          </div>
        </div>

        <div className="grid flex-1 gap-3 sm:max-w-xl sm:grid-cols-2">
          <div className="prode-frame bg-white px-3 py-2">
            <p className="font-technical text-[0.68rem] font-black uppercase text-muted-foreground">
              Tu pronóstico
            </p>
            <p className="mt-1 font-display text-2xl uppercase leading-none">
              {breakdown.predictionScoreLabel}
            </p>
          </div>
          <div className="prode-frame bg-white px-3 py-2">
            <p className="font-technical text-[0.68rem] font-black uppercase text-muted-foreground">
              Resultado final
            </p>
            <p className="mt-1 font-display text-2xl uppercase leading-none">
              {breakdown.actualScoreLabel}
            </p>
          </div>
          <div className="prode-frame bg-white px-3 py-2 sm:col-span-2">
            <p className="font-technical text-[0.68rem] font-black uppercase text-muted-foreground">
              Motivo
            </p>
            <p className="mt-1 font-technical text-xs font-black uppercase">
              {breakdown.reason}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function MatchUnavailablePanel({ match }: { match: PredictionMatch }) {
  if (match.availability.canPredict) {
    return null;
  }

  return (
    <section className="prode-frame prode-hard-shadow bg-prode-yellow p-4 sm:p-5">
      <p className="font-technical text-xs font-black uppercase">
        {match.availability.notice ??
          "Este partido no está disponible para editar."}
      </p>
      {match.availability.helper && (
        <p className="mt-2 max-w-2xl font-body text-sm leading-6">
          {match.availability.helper}
        </p>
      )}
      {match.availability.ctaHref && match.availability.ctaLabel && (
        <Link
          className="prode-frame prode-pressable mt-4 inline-flex min-h-11 items-center justify-center bg-prode-surface px-4 py-2 font-technical text-xs font-black uppercase text-prode-black outline-none focus-visible:ring-[3px] focus-visible:ring-prode-black focus-visible:ring-offset-[3px] focus-visible:ring-offset-prode-paper"
          href={match.availability.ctaHref}
        >
          {match.availability.ctaLabel}
        </Link>
      )}
    </section>
  );
}

export function PredictionCanvas({
  match,
  nextMatchHref,
  nextMatchLabel,
  saveAction,
}: PredictionCanvasProps) {
  const reduceMotion = useReducedMotion();
  const [actionState, formAction, isPending] = useActionState(
    saveAction,
    initialActionState,
  );
  const [prediction, setPrediction] = useState(match.initialPrediction);
  const [quickPick, setQuickPick] = useState<QuickPickValue | null>(null);
  const [isSaved, setIsSaved] = useState(match.initialState === "saved");
  const isPredictionDisabled = match.locked || !match.availability.canPredict;

  const updateScore = (side: "away" | "home", value: number) => {
    setPrediction((current) => ({ ...current, [side]: value }));
    setIsSaved(false);
  };

  const selectQuickPick = (value: QuickPickValue) => {
    setQuickPick(value);
    setPrediction(generateQuickPickScore(value));
    setIsSaved(false);
  };

  useEffect(() => {
    setPrediction(match.initialPrediction);
    setQuickPick(null);
    setIsSaved(match.initialState === "saved");
  }, [
    match.id,
    match.initialPrediction.away,
    match.initialPrediction.home,
    match.initialState,
  ]);

  useEffect(() => {
    if (actionState.status === "success") {
      setIsSaved(true);
    }
  }, [actionState.status]);

  return (
    <div className="flex flex-col gap-6">
      <motion.section
        className="prode-frame prode-hard-shadow relative overflow-hidden bg-prode-surface p-5 sm:p-8 lg:p-10"
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.18 }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-20 text-[22rem] leading-none text-prode-black opacity-[0.04]"
        >
          2026
        </div>

        <div className="relative z-10 flex flex-col items-center justify-between gap-8 md:flex-row md:items-stretch">
          <TeamPredictionBlock
            disabled={isPredictionDisabled}
            label={match.home.code}
            onScoreChange={(value) => updateScore("home", value)}
            score={prediction.home}
            team={match.home}
          />

          <div className="hidden shrink-0 items-center md:flex md:flex-col">
            <div className="h-32 w-[3px] bg-prode-black" />
            <div className="prode-frame prode-hard-shadow my-4 flex size-14 -rotate-6 items-center justify-center bg-prode-yellow font-technical text-lg font-black uppercase">
              VS
            </div>
            <div className="h-32 w-[3px] bg-prode-black" />
          </div>

          <div className="flex w-full items-center justify-center md:hidden">
            <div className="h-[3px] flex-1 bg-prode-black" />
            <div className="prode-frame prode-hard-shadow mx-4 flex h-12 min-w-16 -rotate-3 items-center justify-center bg-prode-yellow px-3 font-technical text-lg font-black uppercase">
              VS
            </div>
            <div className="h-[3px] flex-1 bg-prode-black" />
          </div>

          <TeamPredictionBlock
            disabled={isPredictionDisabled}
            label={match.away.code}
            onScoreChange={(value) => updateScore("away", value)}
            score={prediction.away}
            team={match.away}
          />
        </div>
      </motion.section>

      <QuickPickButtons
        awayTeamName={match.away.name}
        disabled={isPredictionDisabled}
        homeTeamName={match.home.name}
        onSelect={selectQuickPick}
        selected={quickPick}
      />

      <MatchUnavailablePanel match={match} />
      <MatchDetailPointsPanel match={match} />

      {((match.locked && match.availability.canPredict) ||
        actionState.message) && (
        <p
          className={cn(
            "prode-frame bg-prode-surface px-4 py-3 font-technical text-xs font-bold uppercase",
            actionState.status === "error"
              ? "text-red-700"
              : "text-muted-foreground",
          )}
        >
          {match.locked
            ? "Este partido ya cerró. Tu predicción queda disponible para consulta."
            : actionState.message}
        </p>
      )}

      <form action={formAction} className="flex flex-col gap-4 sm:flex-row">
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
        <ProdeButton
          aria-label={`Guardar predicción para ${match.home.name} contra ${match.away.name}`}
          className="flex-1 text-base"
          disabled={isPending || isPredictionDisabled}
          size="large"
          type="submit"
          variant={isSaved ? "ink" : "primary"}
        >
          {!match.availability.canPredict ? null : isSaved ? (
            <Check aria-hidden="true" className="size-5" />
          ) : (
            <Save aria-hidden="true" className="size-5" />
          )}
          {!match.availability.canPredict
            ? match.availability.status === "official-teams-pending"
              ? "Cruce no habilitado"
              : "Predicción cerrada"
            : isSaved
              ? "Predicción guardada"
              : "Guardar predicción"}
        </ProdeButton>

        <Link
          aria-label={nextMatchLabel}
          className="prode-frame prode-hard-shadow prode-pressable inline-flex min-h-14 items-center justify-center gap-2 bg-prode-surface px-5 py-4 font-technical text-base font-bold uppercase text-prode-black outline-none hover:bg-[#fff7b5] focus-visible:ring-[3px] focus-visible:ring-prode-black focus-visible:ring-offset-[3px] focus-visible:ring-offset-prode-paper sm:w-auto"
          href={nextMatchHref}
        >
          {nextMatchLabel}
          <ArrowRight aria-hidden="true" className="size-5" />
        </Link>
      </form>
    </div>
  );
}

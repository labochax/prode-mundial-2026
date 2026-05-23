"use client";

import { ArrowRight, Check, Save } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import {
  QuickPickButtons,
  type QuickPickValue,
} from "@/components/match-detail/quick-pick-buttons";
import { ProdeButton } from "@/components/prode/prode-button";
import { ScoreStepper } from "@/components/dashboard/score-stepper";
import type { MockMatch, MockTeam } from "@/lib/mock/matches";
import type { StitchFlagAsset } from "@/lib/design/stitch-assets";
import { generateQuickPickScore } from "@/lib/scoring/quick-picks";

type PredictionCanvasProps = {
  match: MockMatch;
  nextMatchHref: string;
  nextMatchLabel: string;
};

type TeamPredictionBlockProps = {
  label: string;
  onScoreChange: (value: number) => void;
  score: number;
  team: MockTeam;
};

function getDisplayFlag(team: MockTeam): StitchFlagAsset | undefined {
  return team.detailFlag ?? team.flag;
}

function TeamPredictionBlock({
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
          label={team.name}
          onChange={onScoreChange}
          size="large"
          value={score}
        />
      </div>
    </div>
  );
}

export function PredictionCanvas({
  match,
  nextMatchHref,
  nextMatchLabel,
}: PredictionCanvasProps) {
  const reduceMotion = useReducedMotion();
  const [prediction, setPrediction] = useState(match.initialPrediction);
  const [quickPick, setQuickPick] = useState<QuickPickValue | null>(null);
  const [isSaved, setIsSaved] = useState(match.initialState === "saved");

  const updateScore = (side: "away" | "home", value: number) => {
    setPrediction((current) => ({ ...current, [side]: value }));
    setIsSaved(false);
  };

  const selectQuickPick = (value: QuickPickValue) => {
    setQuickPick(value);
    setPrediction(generateQuickPickScore(value));
    setIsSaved(false);
  };

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
            label={match.away.code}
            onScoreChange={(value) => updateScore("away", value)}
            score={prediction.away}
            team={match.away}
          />
        </div>
      </motion.section>

      <QuickPickButtons
        awayTeamName={match.away.name}
        homeTeamName={match.home.name}
        onSelect={selectQuickPick}
        selected={quickPick}
      />

      <div className="flex flex-col gap-4 sm:flex-row">
        <ProdeButton
          aria-label={`Guardar predicción para ${match.home.name} contra ${match.away.name}`}
          className="flex-1 text-base"
          onClick={() => setIsSaved(true)}
          size="large"
          variant={isSaved ? "ink" : "primary"}
        >
          {isSaved ? (
            <Check aria-hidden="true" className="size-5" />
          ) : (
            <Save aria-hidden="true" className="size-5" />
          )}
          {isSaved ? "Predicción guardada" : "Guardar predicción"}
        </ProdeButton>

        <Link
          aria-label={nextMatchLabel}
          className="prode-frame prode-hard-shadow prode-pressable inline-flex min-h-14 items-center justify-center gap-2 bg-prode-surface px-5 py-4 font-technical text-base font-bold uppercase text-prode-black outline-none hover:bg-[#fff7b5] focus-visible:ring-[3px] focus-visible:ring-prode-black focus-visible:ring-offset-[3px] focus-visible:ring-offset-prode-paper sm:w-auto"
          href={nextMatchHref}
        >
          {nextMatchLabel}
          <ArrowRight aria-hidden="true" className="size-5" />
        </Link>
      </div>
    </div>
  );
}

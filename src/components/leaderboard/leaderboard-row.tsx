"use client";

import { ArrowDown, ArrowUp, Check, Minus, X } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

import type {
  LeaderboardResultMarker,
  RankedMockLeaderboardPlayer,
} from "@/lib/mock/leaderboard";
import { cn } from "@/lib/utils";

type LeaderboardRowProps = {
  player: RankedMockLeaderboardPlayer;
  reduceMotion: boolean;
};

const resultLabels: Record<LeaderboardResultMarker, string> = {
  exact: "Resultado exacto",
  miss: "Pronóstico errado",
  outcome: "Resultado correcto",
};

function ResultMarker({
  isCurrentPlayer,
  marker,
}: {
  isCurrentPlayer?: boolean;
  marker: LeaderboardResultMarker;
}) {
  const isHit = marker !== "miss";
  const isExact = marker === "exact";

  return (
    <span
      aria-label={resultLabels[marker]}
      className={cn(
        "flex size-6 items-center justify-center border-2 border-prode-black",
        isExact && "bg-prode-black text-prode-yellow",
        marker === "outcome" &&
          (isCurrentPlayer
            ? "bg-prode-black text-prode-yellow"
            : "bg-prode-yellow text-prode-black"),
        marker === "miss" && "bg-prode-surface text-prode-black",
      )}
      title={resultLabels[marker]}
    >
      {isHit ? (
        <Check aria-hidden="true" className="size-4 stroke-[3]" />
      ) : (
        <X aria-hidden="true" className="size-4 stroke-[3]" />
      )}
    </span>
  );
}

function TrendIndicator({
  direction,
  value,
}: RankedMockLeaderboardPlayer["trend"]) {
  if (direction === "same") {
    return (
      <span className="inline-flex items-center justify-center gap-1 font-technical text-sm font-black text-prode-black">
        <Minus aria-hidden="true" className="size-5 stroke-[3]" />
      </span>
    );
  }

  const isUp = direction === "up";

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center gap-1 font-technical text-sm font-black",
        isUp ? "text-prode-black" : "text-[#ba1a1a]",
      )}
    >
      {isUp ? (
        <ArrowUp aria-hidden="true" className="size-5 stroke-[3]" />
      ) : (
        <ArrowDown aria-hidden="true" className="size-5 stroke-[3]" />
      )}
      {isUp ? "+" : "-"}
      {value}
    </span>
  );
}

export function LeaderboardRow({ player, reduceMotion }: LeaderboardRowProps) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      aria-label={`Puesto ${player.rank}: ${player.name}, ${player.totalPoints.toLocaleString("es-AR")} puntos`}
      className={cn(
        "group relative grid grid-cols-[3.25rem_minmax(0,1fr)_auto] items-center gap-3 border-b-[3px] border-prode-black px-3 py-4 last:border-b-0 sm:grid-cols-[4rem_minmax(0,1fr)_auto] sm:px-4 md:grid-cols-[4.5rem_minmax(12rem,1fr)_9rem_7rem_8rem] md:px-6 xl:grid-cols-[4.5rem_minmax(12rem,1fr)_10rem_7rem_7rem_7rem_8rem]",
        player.isCurrentPlayer
          ? "z-10 bg-prode-yellow outline outline-[4px] -outline-offset-[4px] outline-prode-black shadow-[8px_8px_0_var(--prode-black)]"
          : "bg-prode-surface hover:bg-[#f7f4df]",
      )}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      layout={reduceMotion ? false : "position"}
      data-current-player={player.isCurrentPlayer ? "true" : undefined}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.16 }}
    >
      {player.isCurrentPlayer && (
        <div
          aria-hidden="true"
          className="absolute -left-2 top-1/2 hidden size-4 -translate-y-1/2 rotate-45 bg-prode-black md:block"
        />
      )}

      <div className="font-display text-4xl uppercase leading-none sm:text-5xl">
        {player.rank}
      </div>

      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <div
          className={cn(
            "relative size-12 shrink-0 overflow-hidden border-[3px] border-prode-black bg-[#e2e2e2] sm:size-14",
            player.isCurrentPlayer && "bg-prode-surface",
          )}
        >
          <Image
            alt={player.avatar.alt}
            className={cn(
              "size-full object-cover",
              !player.isCurrentPlayer && "grayscale",
            )}
            height={player.avatar.height}
            sizes="3.5rem"
            src={player.avatar.src}
            width={player.avatar.width}
          />
        </div>

        <div className="min-w-0">
          {player.isCurrentPlayer && (
            <p className="font-technical text-[0.62rem] font-black uppercase leading-none">
              Tú
            </p>
          )}
          <h2 className="truncate font-editorial text-xl font-bold leading-tight sm:text-2xl">
            {player.name}
          </h2>
          <p className="truncate font-technical text-[0.68rem] font-bold uppercase text-muted-foreground">
            {player.groupName}
          </p>
        </div>
      </div>

      <div className="hidden items-center justify-center gap-1 md:flex">
        {player.lastFive.map((marker, index) => (
          <ResultMarker
            isCurrentPlayer={player.isCurrentPlayer}
            key={`${player.id}-${marker}-${index}`}
            marker={marker}
          />
        ))}
      </div>

      <div className="hidden justify-center md:flex">
        <TrendIndicator {...player.trend} />
      </div>

      <div className="hidden text-center font-technical text-lg font-black uppercase xl:block">
        {player.exactHits}
      </div>

      <div className="hidden text-center font-technical text-lg font-black uppercase xl:block">
        {player.outcomeHits}
      </div>

      <div className="text-right font-technical text-xl font-black uppercase sm:text-2xl">
        {player.totalPoints.toLocaleString("es-AR")}
      </div>
    </motion.div>
  );
}

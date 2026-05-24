"use client";

import { ProdeBadge } from "@/components/prode/prode-badge";
import { RankingToggle } from "@/components/leaderboard/ranking-toggle";
import type { LeaderboardMode } from "@/lib/leaderboard/leaderboard-types";

type LeaderboardHeaderProps = {
  currentRank?: number;
  mode: LeaderboardMode;
  onModeChange: (mode: LeaderboardMode) => void;
  totalPlayers: number;
};

export function LeaderboardHeader({
  currentRank,
  mode,
  onModeChange,
  totalPlayers,
}: LeaderboardHeaderProps) {
  return (
    <header className="flex flex-col gap-6 border-b-[6px] border-prode-black pb-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <ProdeBadge variant="surface">Ranking local</ProdeBadge>
        <h1 className="mt-4 font-display text-5xl uppercase leading-none text-prode-black sm:text-6xl lg:text-7xl">
          Tabla de
          <br />
          Posiciones
        </h1>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end lg:flex-col lg:items-end">
        <div className="flex gap-2 font-technical text-xs font-bold uppercase">
          <div className="prode-frame bg-prode-surface px-3 py-2">
            {totalPlayers} jugadores
          </div>
          {currentRank && (
            <div className="prode-frame bg-prode-yellow px-3 py-2">
              Tu puesto: #{currentRank}
            </div>
          )}
        </div>
        <RankingToggle mode={mode} onModeChange={onModeChange} />
      </div>
    </header>
  );
}

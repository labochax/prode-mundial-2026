"use client";

import { useMemo, useState } from "react";

import { LeaderboardHeader } from "@/components/leaderboard/leaderboard-header";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { ProdeBadge } from "@/components/prode/prode-badge";
import {
  getRankedMockLeaderboard,
  type LeaderboardMode,
} from "@/lib/mock/leaderboard";

const initialVisibleCount = 8;
const loadMoreStep = 4;

export function LeaderboardView() {
  const [mode, setMode] = useState<LeaderboardMode>("global");
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount);

  const rankedPlayers = useMemo(() => getRankedMockLeaderboard(mode), [mode]);
  const currentPlayer = rankedPlayers.find((player) => player.isCurrentPlayer);

  const changeMode = (nextMode: LeaderboardMode) => {
    setMode(nextMode);
    setVisibleCount(initialVisibleCount);
  };

  return (
    <div className="flex flex-col gap-8">
      <LeaderboardHeader
        currentRank={currentPlayer?.rank}
        mode={mode}
        onModeChange={changeMode}
        totalPlayers={rankedPlayers.length}
      />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="prode-frame bg-prode-surface p-4">
          <ProdeBadge variant="primary">Exactos</ProdeBadge>
          <p className="mt-3 font-technical text-3xl font-black">
            {currentPlayer?.exactHits ?? 0}
          </p>
        </div>
        <div className="prode-frame bg-prode-surface p-4">
          <ProdeBadge variant="surface">Aciertos</ProdeBadge>
          <p className="mt-3 font-technical text-3xl font-black">
            {currentPlayer?.outcomeHits ?? 0}
          </p>
        </div>
        <div className="prode-frame bg-prode-yellow p-4">
          <ProdeBadge variant="ink">Puntos</ProdeBadge>
          <p className="mt-3 font-technical text-3xl font-black">
            {(currentPlayer?.totalPoints ?? 0).toLocaleString("es-AR")}
          </p>
        </div>
      </section>

      <LeaderboardTable
        onLoadMore={() =>
          setVisibleCount((current) =>
            Math.min(current + loadMoreStep, rankedPlayers.length),
          )
        }
        players={rankedPlayers}
        visibleCount={visibleCount}
      />

      <p className="max-w-3xl font-technical text-xs font-bold uppercase text-muted-foreground">
        Datos locales de prueba. El ranking real saldrá de Supabase cuando estén
        conectados resultados oficiales, bloqueos por partido y cálculo de
        puntaje.
      </p>
    </div>
  );
}

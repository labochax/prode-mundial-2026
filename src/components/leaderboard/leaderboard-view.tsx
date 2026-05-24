"use client";

import { useState } from "react";

import { LeaderboardHeader } from "@/components/leaderboard/leaderboard-header";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { ProdeBadge } from "@/components/prode/prode-badge";
import type {
  LeaderboardMode,
  LeaderboardPlayer,
} from "@/lib/leaderboard/leaderboard-types";

const initialVisibleCount = 8;
const loadMoreStep = 4;

type LeaderboardViewProps = {
  players: LeaderboardPlayer[];
};

export function LeaderboardView({ players }: LeaderboardViewProps) {
  const [mode, setMode] = useState<LeaderboardMode>("global");
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount);

  const currentPlayer = players.find((player) => player.isCurrentPlayer);
  const hasScoredPredictions = players.some(
    (player) => player.predictedMatchesCount > 0,
  );

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
        totalPlayers={players.length}
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

      {hasScoredPredictions ? (
        <LeaderboardTable
          onLoadMore={() =>
            setVisibleCount((current) =>
              Math.min(current + loadMoreStep, players.length),
            )
          }
          players={players}
          visibleCount={visibleCount}
        />
      ) : (
        <section className="prode-frame prode-hard-shadow bg-prode-surface p-6 text-prode-black">
          <ProdeBadge variant="primary">Sin puntos</ProdeBadge>
          <h2 className="mt-4 font-display text-4xl uppercase leading-none sm:text-5xl">
            Todavía no hay puntos
          </h2>
          <p className="mt-3 max-w-2xl font-body text-base">
            Cargá predicciones y simulá resultados para ver la tabla.
          </p>
        </section>
      )}

      <p className="max-w-3xl font-technical text-xs font-bold uppercase text-muted-foreground">
        Datos locales de Supabase. En este MVP local, Global y Amigos usan el
        mismo pool de prueba hasta implementar grupos reales.
      </p>
    </div>
  );
}

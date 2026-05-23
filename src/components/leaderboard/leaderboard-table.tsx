"use client";

import { ArrowDown } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { LeaderboardRow } from "@/components/leaderboard/leaderboard-row";
import { prodeButtonVariants } from "@/components/prode/prode-button";
import type { RankedMockLeaderboardPlayer } from "@/lib/mock/leaderboard";
import { cn } from "@/lib/utils";

type LeaderboardTableProps = {
  onLoadMore: () => void;
  players: RankedMockLeaderboardPlayer[];
  visibleCount: number;
};

export function LeaderboardTable({
  onLoadMore,
  players,
  visibleCount,
}: LeaderboardTableProps) {
  const reduceMotion = useReducedMotion();
  const visiblePlayers = players.slice(0, visibleCount);
  const hasMore = visibleCount < players.length;

  return (
    <section aria-label="Tabla de posiciones" className="space-y-8">
      <div className="prode-frame prode-hard-shadow overflow-visible bg-prode-surface">
        <div className="hidden grid-cols-[4.5rem_minmax(12rem,1fr)_9rem_7rem_8rem] items-center gap-3 border-b-[3px] border-prode-black bg-[#ebe9d4] px-6 py-3 font-technical text-xs font-bold uppercase text-muted-foreground md:grid xl:grid-cols-[4.5rem_minmax(12rem,1fr)_10rem_7rem_7rem_7rem_8rem]">
          <div>Pos</div>
          <div>Jugador</div>
          <div className="text-center">Últimos resultados</div>
          <div className="text-center">Tendencia</div>
          <div className="hidden text-center xl:block">Exactos</div>
          <div className="hidden text-center xl:block">Aciertos</div>
          <div className="text-right">Pts totales</div>
        </div>

        <motion.div
          className="grid"
          layout={reduceMotion ? false : "position"}
        >
          <AnimatePresence initial={false}>
            {visiblePlayers.map((player) => (
              <LeaderboardRow
                key={player.id}
                player={player}
                reduceMotion={Boolean(reduceMotion)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      <div className="flex justify-center">
        <button
          className={cn(
            prodeButtonVariants({
              className: "px-8 font-display text-3xl",
              size: "large",
              variant: "surface",
            }),
            !hasMore && "hidden",
          )}
          onClick={onLoadMore}
          type="button"
        >
          <ArrowDown aria-hidden="true" className="size-6 stroke-[3]" />
          Cargar más
        </button>
      </div>
    </section>
  );
}

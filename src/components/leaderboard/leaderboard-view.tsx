"use client";

import { useMemo, useState } from "react";

import { LeaderboardHeader } from "@/components/leaderboard/leaderboard-header";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { ProdeBadge } from "@/components/prode/prode-badge";
import {
  filterLeaderboardPlayersByGroups,
  getCurrentPlayerDefaultGroupValue,
  getLeaderboardGroupValues,
  leaderboardGroupDimensions,
  type LeaderboardActiveGroupFilter,
} from "@/lib/leaderboard/group-filters";
import type {
  LeaderboardGroupDimension,
  LeaderboardMode,
  LeaderboardPlayer,
} from "@/lib/leaderboard/leaderboard-types";

const initialVisibleCount = 8;
const loadMoreStep = 4;

type LeaderboardViewProps = {
  players: LeaderboardPlayer[];
};

function getNextAvailableDimension(
  activeFilters: LeaderboardActiveGroupFilter[],
) {
  const activeDimensions = new Set(
    activeFilters.map((filter) => filter.dimension),
  );

  return (
    leaderboardGroupDimensions.find(
      (dimension) => !activeDimensions.has(dimension.value),
    )?.value ?? null
  );
}

export function LeaderboardView({ players }: LeaderboardViewProps) {
  const globalCurrentPlayer = players.find((player) => player.isCurrentPlayer);
  const defaultSubgroupValue = getCurrentPlayerDefaultGroupValue(
    globalCurrentPlayer,
    "subgroup",
  );
  const [mode, setMode] = useState<LeaderboardMode>("global");
  const [activeGroupFilters, setActiveGroupFilters] = useState<
    LeaderboardActiveGroupFilter[]
  >(() =>
    defaultSubgroupValue
      ? [
          {
            ...defaultSubgroupValue,
            dimension: "subgroup",
          },
        ]
      : [],
  );
  const [draftDimension, setDraftDimension] =
    useState<LeaderboardGroupDimension | null>(() =>
      getNextAvailableDimension(
        defaultSubgroupValue
          ? [
              {
                ...defaultSubgroupValue,
                dimension: "subgroup",
              },
            ]
          : [],
      ),
    );
  const [draftValueByDimension, setDraftValueByDimension] = useState<
    Partial<Record<LeaderboardGroupDimension, string>>
  >({});
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount);

  const availableAddDimensions = useMemo(() => {
    const activeDimensions = new Set(
      activeGroupFilters.map((filter) => filter.dimension),
    );

    return leaderboardGroupDimensions.filter(
      (dimension) => !activeDimensions.has(dimension.value),
    );
  }, [activeGroupFilters]);
  const availableAddValues = draftDimension
    ? getLeaderboardGroupValues(players, draftDimension, activeGroupFilters)
    : [];
  const draftValue =
    (draftDimension && draftValueByDimension[draftDimension]) ||
    availableAddValues[0]?.normalizedValue ||
    null;
  const activePlayers =
    mode === "groups"
      ? filterLeaderboardPlayersByGroups(players, activeGroupFilters)
      : players;
  const rankedPlayers =
    mode === "groups"
      ? activePlayers.map((player, index) => ({
          ...player,
          rank: index + 1,
        }))
      : activePlayers;
  const currentPlayer = rankedPlayers.find((player) => player.isCurrentPlayer);
  const hasLeaderboardPoints = rankedPlayers.some(
    (player) =>
      player.predictedMatchesCount > 0 ||
      player.matchPoints > 0 ||
      player.miMundialBonusPoints > 0,
  );
  const hasMiMundialBonus = rankedPlayers.some(
    (player) => player.miMundialBonusPoints > 0,
  );
  const hasCurrentPlayerSubgroup = Boolean(defaultSubgroupValue);
  const hasActiveAgeFilter = activeGroupFilters.some(
    (filter) => filter.dimension === "ageGroup",
  );

  const changeMode = (nextMode: LeaderboardMode) => {
    setMode(nextMode);
    setVisibleCount(initialVisibleCount);
  };

  const changeDraftDimension = (nextDimension: LeaderboardGroupDimension) => {
    setDraftDimension(nextDimension);
    setVisibleCount(initialVisibleCount);
  };

  const changeDraftValue = (nextValue: string) => {
    if (!draftDimension) {
      return;
    }

    setDraftValueByDimension((current) => ({
      ...current,
      [draftDimension]: nextValue,
    }));
  };

  const addFilter = () => {
    if (!draftDimension || !draftValue) {
      return;
    }

    const selectedValue = availableAddValues.find(
      (value) => value.normalizedValue === draftValue,
    );

    if (!selectedValue) {
      return;
    }

    const nextFilters = [
      ...activeGroupFilters,
      {
        ...selectedValue,
        dimension: draftDimension,
      },
    ];

    setActiveGroupFilters(nextFilters);
    setDraftDimension(getNextAvailableDimension(nextFilters));
    setVisibleCount(initialVisibleCount);
  };

  const removeFilter = (dimension: LeaderboardGroupDimension) => {
    const nextFilters = activeGroupFilters.filter(
      (filter) => filter.dimension !== dimension,
    );

    setActiveGroupFilters(nextFilters);
    setDraftDimension((current) => current ?? getNextAvailableDimension(nextFilters));
    setVisibleCount(initialVisibleCount);
  };

  const clearFilters = () => {
    setActiveGroupFilters([]);
    setDraftDimension(getNextAvailableDimension([]));
    setVisibleCount(initialVisibleCount);
  };

  const getEmptyTitle = () => {
    if (mode !== "groups") {
      return "Todavía no hay puntos";
    }

    if (activeGroupFilters.length === 0) {
      return hasCurrentPlayerSubgroup
        ? "Elegí al menos un filtro para armar tu grupo."
        : "Completá al menos un subgrupo en tu perfil para competir por grupos.";
    }

    if (rankedPlayers.length === 0 && hasActiveAgeFilter) {
      return "Todavía no hay jugadores en este grupo etario.";
    }

    if (rankedPlayers.length === 0) {
      return "No hay jugadores que coincidan con esta combinación.";
    }

    return "Todavía no hay puntos en este grupo.";
  };

  return (
    <div className="flex flex-col gap-8">
      <LeaderboardHeader
        activeFilters={activeGroupFilters}
        availableAddDimensions={availableAddDimensions}
        availableAddValues={availableAddValues}
        currentRank={currentPlayer?.rank}
        draftDimension={draftDimension}
        draftValue={draftValue}
        mode={mode}
        onAddFilter={addFilter}
        onClearFilters={clearFilters}
        onDraftDimensionChange={changeDraftDimension}
        onDraftValueChange={changeDraftValue}
        onModeChange={changeMode}
        onRemoveFilter={removeFilter}
        totalPlayers={activePlayers.length}
      />

      <p className="max-w-4xl font-body text-sm leading-6 text-muted-foreground">
        Compará tu posición contra jugadores que comparten subgrupo, club,
        colegio, grupo etario, país, provincia o ciudad.
      </p>

      {mode === "groups" && !hasCurrentPlayerSubgroup && (
        <div className="prode-frame bg-[#f7f4df] px-4 py-3 font-technical text-xs font-bold uppercase text-muted-foreground">
          Completá al menos un subgrupo en tu perfil para competir por grupos.
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="prode-frame bg-prode-surface p-4">
          <ProdeBadge variant="primary">Puntos partidos</ProdeBadge>
          <p className="mt-3 font-technical text-3xl font-black">
            {(currentPlayer?.matchPoints ?? 0).toLocaleString("es-AR")}
          </p>
        </div>
        <div className="prode-frame bg-prode-surface p-4">
          <ProdeBadge variant="surface">Bonus Mi Mundial</ProdeBadge>
          <p className="mt-3 font-technical text-3xl font-black">
            {(currentPlayer?.miMundialBonusPoints ?? 0).toLocaleString("es-AR")}
          </p>
        </div>
        <div className="prode-frame bg-prode-yellow p-4">
          <ProdeBadge variant="ink">Total</ProdeBadge>
          <p className="mt-3 font-technical text-3xl font-black">
            {(currentPlayer?.totalPoints ?? 0).toLocaleString("es-AR")}
          </p>
        </div>
      </section>

      {!hasMiMundialBonus && (
        <p className="max-w-3xl font-technical text-xs font-bold uppercase text-muted-foreground">
          El bonus de Mi Mundial se suma cuando esté puntuado.
        </p>
      )}

      {hasLeaderboardPoints ? (
        <LeaderboardTable
          onLoadMore={() =>
            setVisibleCount((current) =>
              Math.min(current + loadMoreStep, rankedPlayers.length),
            )
          }
          players={rankedPlayers}
          visibleCount={visibleCount}
        />
      ) : (
        <section className="prode-frame prode-hard-shadow bg-prode-surface p-6 text-prode-black">
          <ProdeBadge variant="primary">
            {mode === "groups" ? "Grupos" : "Sin puntos"}
          </ProdeBadge>
          <h2 className="mt-4 font-display text-4xl uppercase leading-none sm:text-5xl">
            {getEmptyTitle()}
          </h2>
          <p className="mt-3 max-w-2xl font-body text-base">
            {mode === "groups"
              ? "Los grupos se arman combinando datos compartidos del perfil dentro del pool."
              : "Cargá predicciones y simulá resultados para ver la tabla."}
          </p>
        </section>
      )}

      <p className="max-w-3xl font-technical text-xs font-bold uppercase text-muted-foreground">
        Datos locales de Supabase. Global usa todo el pool; Grupos combina
        filtros de perfil con lógica AND.
      </p>
    </div>
  );
}

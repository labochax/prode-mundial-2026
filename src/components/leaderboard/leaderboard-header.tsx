"use client";

import { Plus, X } from "lucide-react";

import { RankingToggle } from "@/components/leaderboard/ranking-toggle";
import { ProdeBadge } from "@/components/prode/prode-badge";
import {
  getLeaderboardGroupDimensionLabel,
  type LeaderboardActiveGroupFilter,
  type LeaderboardGroupDimensionOption,
  type LeaderboardGroupFilterValue,
} from "@/lib/leaderboard/group-filters";
import type {
  LeaderboardGroupDimension,
  LeaderboardMode,
} from "@/lib/leaderboard/leaderboard-types";
import { cn } from "@/lib/utils";

type LeaderboardHeaderProps = {
  activeFilters: LeaderboardActiveGroupFilter[];
  availableAddDimensions: LeaderboardGroupDimensionOption[];
  availableAddValues: LeaderboardGroupFilterValue[];
  currentRank?: number;
  draftDimension: LeaderboardGroupDimension | null;
  draftValue: string | null;
  mode: LeaderboardMode;
  onAddFilter: () => void;
  onClearFilters: () => void;
  onDraftDimensionChange: (dimension: LeaderboardGroupDimension) => void;
  onDraftValueChange: (normalizedValue: string) => void;
  onModeChange: (mode: LeaderboardMode) => void;
  onRemoveFilter: (dimension: LeaderboardGroupDimension) => void;
  totalPlayers: number;
};

export function LeaderboardHeader({
  activeFilters,
  availableAddDimensions,
  availableAddValues,
  currentRank,
  draftDimension,
  draftValue,
  mode,
  onAddFilter,
  onClearFilters,
  onDraftDimensionChange,
  onDraftValueChange,
  onModeChange,
  onRemoveFilter,
  totalPlayers,
}: LeaderboardHeaderProps) {
  const canAddFilter =
    Boolean(draftDimension) &&
    Boolean(draftValue) &&
    availableAddValues.length > 0;

  return (
    <header className="border-b-[6px] border-prode-black pb-5">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
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
      </div>

      {mode === "groups" && (
        <div className="mt-5 grid gap-4 border-t-[3px] border-prode-black pt-5">
          <div className="grid gap-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-technical text-xs font-black uppercase">
                Filtros activos
              </p>
              {activeFilters.length > 0 && (
                <button
                  className="prode-pressable self-start border-[3px] border-prode-black bg-prode-surface px-3 py-2 font-technical text-[11px] font-black uppercase shadow-[3px_3px_0_#1c1c0f] transition hover:bg-[#fff7b5] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:self-auto"
                  onClick={onClearFilters}
                  type="button"
                >
                  Limpiar filtros
                </button>
              )}
            </div>

            {activeFilters.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {activeFilters.map((filter) => (
                  <div
                    className="prode-frame prode-hard-shadow flex min-h-14 items-center gap-3 bg-prode-yellow px-3 py-2"
                    key={filter.dimension}
                  >
                    <div className="grid gap-0.5">
                      <span className="font-technical text-[10px] font-black uppercase text-prode-black/70">
                        {getLeaderboardGroupDimensionLabel(filter.dimension)}
                      </span>
                      <strong className="font-technical text-xs font-black uppercase text-prode-black">
                        {filter.label}
                      </strong>
                    </div>
                    <button
                      aria-label={`Quitar filtro ${getLeaderboardGroupDimensionLabel(
                        filter.dimension,
                      )}`}
                      className="grid size-8 place-items-center border-[3px] border-prode-black bg-prode-surface text-prode-black transition hover:bg-[#fff7b5] active:translate-x-[1px] active:translate-y-[1px]"
                      onClick={() => onRemoveFilter(filter.dimension)}
                      type="button"
                    >
                      <X aria-hidden="true" className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="prode-frame bg-prode-surface px-3 py-2 font-technical text-xs font-bold uppercase text-muted-foreground">
                Elegí al menos un filtro para armar tu grupo.
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(12rem,16rem)_minmax(12rem,1fr)_auto] sm:items-end">
            <label className="grid gap-2 font-technical text-xs font-bold uppercase">
              Agregar filtro
              <select
                className="prode-frame min-h-12 bg-prode-surface px-3 font-technical text-xs font-black uppercase outline-none focus-visible:ring-[3px] focus-visible:ring-prode-black focus-visible:ring-offset-[3px] focus-visible:ring-offset-prode-paper disabled:opacity-60"
                disabled={availableAddDimensions.length === 0}
                onChange={(event) =>
                  onDraftDimensionChange(
                    event.target.value as LeaderboardGroupDimension,
                  )
                }
                value={draftDimension ?? ""}
              >
                {availableAddDimensions.length > 0 ? (
                  availableAddDimensions.map((dimension) => (
                    <option key={dimension.value} value={dimension.value}>
                      {dimension.label}
                    </option>
                  ))
                ) : (
                  <option value="">Sin filtros disponibles</option>
                )}
              </select>
            </label>

            <label className="grid gap-2 font-technical text-xs font-bold uppercase">
              Valor
              <select
                className="prode-frame min-h-12 bg-prode-surface px-3 font-technical text-xs font-black uppercase outline-none focus-visible:ring-[3px] focus-visible:ring-prode-black focus-visible:ring-offset-[3px] focus-visible:ring-offset-prode-paper disabled:opacity-60"
                disabled={!draftDimension || availableAddValues.length === 0}
                onChange={(event) => onDraftValueChange(event.target.value)}
                value={draftValue ?? ""}
              >
                {availableAddValues.length > 0 ? (
                  availableAddValues.map((value) => (
                    <option key={value.normalizedValue} value={value.normalizedValue}>
                      {value.label}
                    </option>
                  ))
                ) : (
                  <option value="">Sin valores cargados</option>
                )}
              </select>
            </label>

            <button
              className={cn(
                "prode-pressable inline-flex min-h-12 items-center justify-center gap-2 border-[3px] border-prode-black bg-prode-yellow px-4 font-technical text-xs font-black uppercase shadow-[4px_4px_0_#1c1c0f] transition active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:cursor-not-allowed disabled:bg-prode-surface disabled:opacity-60",
                canAddFilter && "hover:bg-[#fff7b5]",
              )}
              disabled={!canAddFilter}
              onClick={onAddFilter}
              type="button"
            >
              <Plus aria-hidden="true" className="size-4" />
              Agregar
            </button>
          </div>

          {availableAddDimensions.length === 0 && (
            <p className="font-technical text-[11px] font-bold uppercase text-muted-foreground">
              Ya agregaste todos los filtros disponibles.
            </p>
          )}
        </div>
      )}
    </header>
  );
}

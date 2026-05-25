"use client";

import { useMemo, useState } from "react";

import { ProdeButton } from "@/components/prode/prode-button";
import {
  buildDerivedKnockoutRounds,
  getBracketBonusPreview,
  type DerivedKnockoutMatch,
  type KnockoutSelectionMap,
  type KnockoutSummary,
} from "@/lib/tournament/knockout-selection";
import type {
  ProjectedBracket,
  ProjectedBracketSlot,
} from "@/lib/tournament/types";
import { cn } from "@/lib/utils";

type InteractiveKnockoutBracketProps = {
  bracket: ProjectedBracket;
};

function TeamButton({
  disabled,
  isSelected,
  matchupId,
  onSelect,
  slot,
}: {
  disabled?: boolean;
  isSelected: boolean;
  matchupId: string;
  onSelect: (matchupId: string, teamId: string) => void;
  slot: ProjectedBracketSlot;
}) {
  const isDisabled = disabled || slot.isPlaceholder;

  return (
    <button
      aria-pressed={isSelected}
      className={cn(
        "prode-frame prode-pressable w-full bg-[#f7f4df] p-3 text-left outline-none transition focus-visible:ring-[3px] focus-visible:ring-prode-black focus-visible:ring-offset-[3px] focus-visible:ring-offset-prode-paper",
        isSelected && "prode-hard-shadow bg-prode-yellow",
        isDisabled && "cursor-not-allowed bg-prode-surface text-muted-foreground",
      )}
      disabled={isDisabled}
      onClick={() => onSelect(matchupId, slot.team.id)}
      type="button"
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "prode-frame px-2 py-1 font-technical text-xs font-black uppercase leading-none",
            isSelected ? "bg-prode-surface" : "bg-prode-yellow",
            slot.isPlaceholder && "bg-[#f7f4df]",
          )}
        >
          {slot.slotLabel}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-technical text-sm font-black uppercase">
            {slot.team.name}
          </p>
          <p className="mt-1 font-technical text-[0.68rem] font-black uppercase text-muted-foreground">
            {slot.originLabel}
          </p>
          {slot.ruleLabel && (
            <p className="mt-1 font-technical text-[0.62rem] font-black uppercase text-muted-foreground">
              {slot.ruleLabel}
            </p>
          )}
        </div>
      </div>
      <p className="mt-3 border-t-[2px] border-prode-black/30 pt-2 font-technical text-[0.62rem] font-black uppercase text-muted-foreground">
        {slot.qualificationType}
      </p>
    </button>
  );
}

function SelectableMatchCard({
  disabled,
  matchup,
  onSelect,
  selections,
}: {
  disabled?: boolean;
  matchup: DerivedKnockoutMatch;
  onSelect: (matchupId: string, teamId: string) => void;
  selections: KnockoutSelectionMap;
}) {
  const selectedTeamId = selections[matchup.id];

  return (
    <article className="prode-frame prode-hard-shadow bg-prode-surface p-3">
      <header className="mb-3 flex items-center justify-between gap-3 border-b-[3px] border-prode-black pb-2">
        <h3 className="font-technical text-xs font-black uppercase">
          {matchup.slotLabel}
        </h3>
        <span className="prode-frame bg-prode-yellow px-2 py-1 font-technical text-[0.62rem] font-black uppercase">
          {matchup.roundLabel}
        </span>
      </header>

      <div className="space-y-3">
        <TeamButton
          disabled={disabled}
          isSelected={selectedTeamId === matchup.home.team.id}
          matchupId={matchup.id}
          onSelect={onSelect}
          slot={matchup.home}
        />
        <div className="flex items-center gap-2">
          <span className="h-[3px] flex-1 bg-prode-black" />
          <span className="font-display text-3xl uppercase leading-none">VS</span>
          <span className="h-[3px] flex-1 bg-prode-black" />
        </div>
        <TeamButton
          disabled={disabled}
          isSelected={selectedTeamId === matchup.away.team.id}
          matchupId={matchup.id}
          onSelect={onSelect}
          slot={matchup.away}
        />
      </div>
    </article>
  );
}

function LockedRoundState() {
  return (
    <div className="prode-frame prode-hard-shadow bg-prode-surface p-5">
      <h3 className="font-display text-4xl uppercase leading-none">
        Fase bloqueada
      </h3>
      <p className="mt-3 max-w-2xl font-body text-base text-muted-foreground">
        Elegí los ganadores de la ronda anterior para completar esta fase.
      </p>
    </div>
  );
}

function RoundSection({
  disabled,
  matches,
  onSelect,
  selections,
  title,
}: {
  disabled?: boolean;
  matches: DerivedKnockoutMatch[];
  onSelect: (matchupId: string, teamId: string) => void;
  selections: KnockoutSelectionMap;
  title: string;
}) {
  return (
    <section className="space-y-4">
      <div className="border-y-[3px] border-prode-black bg-prode-yellow px-4 py-3 shadow-[6px_6px_0_var(--prode-black)]">
        <h3 className="font-display text-4xl uppercase leading-none">{title}</h3>
      </div>

      {matches.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-4">
          {matches.map((matchup) => (
            <SelectableMatchCard
              disabled={disabled}
              key={matchup.id}
              matchup={matchup}
              onSelect={onSelect}
              selections={selections}
            />
          ))}
        </div>
      ) : (
        <LockedRoundState />
      )}
    </section>
  );
}

function FinalRoundSection({
  final,
  onSelect,
  selections,
  thirdPlace,
}: {
  final: DerivedKnockoutMatch[];
  onSelect: (matchupId: string, teamId: string) => void;
  selections: KnockoutSelectionMap;
  thirdPlace: DerivedKnockoutMatch[];
}) {
  return (
    <section className="space-y-4">
      <div className="border-y-[3px] border-prode-black bg-prode-yellow px-4 py-3 shadow-[6px_6px_0_var(--prode-black)]">
        <h3 className="font-display text-4xl uppercase leading-none">
          Final y 3.º puesto
        </h3>
      </div>

      {final.length > 0 && thirdPlace.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {[...final, ...thirdPlace].map((matchup) => (
            <SelectableMatchCard
              key={matchup.id}
              matchup={matchup}
              onSelect={onSelect}
              selections={selections}
            />
          ))}
        </div>
      ) : (
        <LockedRoundState />
      )}
    </section>
  );
}

function SummaryItem({
  label,
  slot,
}: {
  label: string;
  slot: ProjectedBracketSlot | null;
}) {
  return (
    <div className="prode-frame bg-[#f7f4df] p-3">
      <p className="font-technical text-[0.68rem] font-black uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 truncate font-technical text-lg font-black uppercase">
        {slot?.team.name ?? "Por definir"}
      </p>
    </div>
  );
}

function ChampionSummaryItem({ slot }: { slot: ProjectedBracketSlot | null }) {
  return (
    <div className="prode-frame prode-hard-shadow bg-prode-yellow p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="prode-frame bg-prode-surface px-3 py-2 font-technical text-xs font-black uppercase">
            CAMPEÓN
          </span>
          <p className="mt-4 font-technical text-[0.72rem] font-black uppercase text-prode-black/70">
            Tu elegido para levantar la copa
          </p>
        </div>
        <span className="font-display text-5xl uppercase leading-none text-prode-black">
          1.º
        </span>
      </div>
      <p className="mt-4 break-words font-display text-5xl uppercase leading-none text-prode-black sm:text-6xl">
        {slot?.team.name ?? "Por definir"}
      </p>
    </div>
  );
}

function SummaryCard({ summary }: { summary: KnockoutSummary }) {
  const bonus = getBracketBonusPreview();

  return (
    <section className="prode-frame prode-hard-shadow bg-prode-surface p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="prode-frame bg-prode-yellow px-3 py-2 font-technical text-xs font-black uppercase">
            No guardado todavía
          </span>
          <h3 className="mt-4 font-display text-5xl uppercase leading-none">
            Resumen de Mi Mundial
          </h3>
        </div>
        <div className="prode-frame bg-prode-yellow px-4 py-3 font-technical text-sm font-black uppercase">
          Bonus máximo posible: {bonus.maxPossiblePoints} puntos
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <ChampionSummaryItem slot={summary.champion} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-1">
          <SummaryItem label="Subcampeón" slot={summary.runnerUp} />
          <SummaryItem label="3.º" slot={summary.thirdPlace} />
          <SummaryItem label="4.º" slot={summary.fourthPlace} />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-2 lg:grid-cols-2 xl:grid-cols-4">
        {bonus.rules.map((rule) => (
          <div
            className="border-[2px] border-prode-black/40 bg-[#f7f4df] px-3 py-2 font-technical text-[0.68rem] font-black uppercase text-muted-foreground"
            key={rule.label}
          >
            {rule.label}: +{rule.pointsPerHit} / {rule.total} pts
          </div>
        ))}
      </div>

      <ProdeButton className="mt-5" disabled>
        Guardar predicción próximamente
      </ProdeButton>
    </section>
  );
}

export function InteractiveKnockoutBracket({
  bracket,
}: InteractiveKnockoutBracketProps) {
  const [selections, setSelections] = useState<KnockoutSelectionMap>({});
  const rounds = useMemo(
    () => buildDerivedKnockoutRounds(bracket.roundOf32, selections),
    [bracket.roundOf32, selections],
  );
  const handleSelect = (matchupId: string, teamId: string) => {
    setSelections((current) => ({
      ...current,
      [matchupId]: teamId,
    }));
  };

  return (
    <section className="space-y-8">
      <div className="prode-frame prode-hard-shadow bg-prode-surface p-5">
        <div className="max-w-4xl">
          <span className="prode-frame bg-prode-yellow px-3 py-2 font-technical text-xs font-black uppercase">
            Sin persistencia
          </span>
          <h2 className="mt-4 font-display text-5xl uppercase leading-none">
            Completá tu llave
          </h2>
          <p className="mt-3 font-body text-base leading-7 text-muted-foreground">
            Elegí quién avanza en cada cruce. Esta proyección todavía no se
            guarda: servirá como base para el bonus pre-torneo.
          </p>
        </div>
      </div>

      <RoundSection
        disabled={bracket.status !== "complete"}
        matches={rounds.roundOf32}
        onSelect={handleSelect}
        selections={selections}
        title="16avos"
      />
      <RoundSection
        matches={rounds.roundOf16}
        onSelect={handleSelect}
        selections={selections}
        title="Octavos"
      />
      <RoundSection
        matches={rounds.quarterfinals}
        onSelect={handleSelect}
        selections={selections}
        title="Cuartos"
      />
      <RoundSection
        matches={rounds.semifinals}
        onSelect={handleSelect}
        selections={selections}
        title="Semifinales"
      />
      <FinalRoundSection
        final={rounds.final}
        onSelect={handleSelect}
        selections={selections}
        thirdPlace={rounds.thirdPlace}
      />
      <SummaryCard summary={rounds.summary} />
    </section>
  );
}

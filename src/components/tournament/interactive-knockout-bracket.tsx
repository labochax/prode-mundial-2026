"use client";

import { useMemo, useState, useTransition } from "react";

import type { SaveTournamentPredictionActionState } from "@/app/actions/tournament-predictions";
import { ProdeButton } from "@/components/prode/prode-button";
import type { ActualTournamentOutcomeResult } from "@/lib/tournament/actual-outcomes";
import {
  buildTournamentBonusBreakdown,
  getBonusSummarySegments,
  getStageBonusBadgeLabel,
  getStageTeamBonusStatusLabel,
  type StageBonusDetails,
  type TournamentBonusBreakdownResult,
} from "@/lib/tournament/bonus-breakdown";
import type { TournamentBonusPrediction } from "@/lib/tournament/bonus-scoring";
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
  bonusActualOutcomeResult: ActualTournamentOutcomeResult;
  initialSaveState: "locked" | "saved" | "unsaved";
  initialSelections: KnockoutSelectionMap;
  isLocked: boolean;
  lockedAt: string | null;
  saveAction: (input: {
    selections: KnockoutSelectionMap;
  }) => Promise<SaveTournamentPredictionActionState>;
  savedAt: string | null;
};

type TeamBonusBadge = {
  hit: boolean;
  label: string;
  points?: number;
  variant: "placement" | "stage";
};

function TeamButton({
  disabled,
  isSelected,
  matchupId,
  onSelect,
  bonusBadge,
  slot,
}: {
  bonusBadge?: TeamBonusBadge;
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
      {bonusBadge && (
        <div
          className={cn(
            "prode-frame mt-3 inline-flex items-center gap-2 px-2 py-1 font-technical text-[0.62rem] font-black uppercase",
            bonusBadge.hit
              ? "bg-prode-yellow text-prode-black"
              : "bg-prode-surface text-muted-foreground",
          )}
        >
          <span>{bonusBadge.label}</span>
          {bonusBadge.variant === "placement" && (
            <span>{bonusBadge.hit ? `+${bonusBadge.points ?? 0}` : "+0"}</span>
          )}
        </div>
      )}
    </button>
  );
}

function SelectableMatchCard({
  disabled,
  matchup,
  onSelect,
  bonusByTeamId,
  stageBonusLabel,
  selections,
}: {
  bonusByTeamId?: Map<string, TeamBonusBadge>;
  disabled?: boolean;
  matchup: DerivedKnockoutMatch;
  onSelect: (matchupId: string, teamId: string) => void;
  selections: KnockoutSelectionMap;
  stageBonusLabel?: string;
}) {
  const selectedTeamId = selections[matchup.id];

  return (
    <article className="prode-frame prode-hard-shadow bg-prode-surface p-3">
      <header className="mb-3 flex items-center justify-between gap-3 border-b-[3px] border-prode-black pb-2">
        <h3 className="font-technical text-xs font-black uppercase">
          {matchup.slotLabel}
        </h3>
        <div className="flex shrink-0 items-center gap-2">
          {stageBonusLabel && (
            <span className="prode-frame bg-prode-black px-2 py-1 font-technical text-[0.62rem] font-black uppercase text-prode-yellow">
              {stageBonusLabel}
            </span>
          )}
          <span className="prode-frame bg-prode-yellow px-2 py-1 font-technical text-[0.62rem] font-black uppercase">
            {matchup.roundLabel}
          </span>
        </div>
      </header>

      <div className="space-y-3">
        <TeamButton
          bonusBadge={bonusByTeamId?.get(matchup.home.team.id)}
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
          bonusBadge={bonusByTeamId?.get(matchup.away.team.id)}
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

function PendingRoundState() {
  return (
    <div className="prode-frame prode-hard-shadow bg-prode-surface p-5">
      <h3 className="font-display text-4xl uppercase leading-none">
        Completá la ronda anterior
      </h3>
      <p className="mt-3 max-w-2xl font-body text-base text-muted-foreground">
        Elegí los ganadores de la ronda anterior para completar esta fase.
      </p>
    </div>
  );
}

function collectRoundTeamIds(matches: DerivedKnockoutMatch[]) {
  return matches.flatMap((matchup) =>
    [matchup.home, matchup.away]
      .filter((slot) => !slot.isPlaceholder)
      .map((slot) => slot.team.id),
  );
}

function buildBonusPredictionFromRounds(
  rounds: ReturnType<typeof buildDerivedKnockoutRounds>,
): TournamentBonusPrediction | null {
  if (
    !rounds.summary.champion ||
    !rounds.summary.runnerUp ||
    !rounds.summary.thirdPlace ||
    !rounds.summary.fourthPlace
  ) {
    return null;
  }

  return {
    championTeamId: rounds.summary.champion.team.id,
    fourthPlaceTeamId: rounds.summary.fourthPlace.team.id,
    quarterfinalTeamIds: collectRoundTeamIds(rounds.quarterfinals),
    roundOf16TeamIds: collectRoundTeamIds(rounds.roundOf16),
    runnerUpTeamId: rounds.summary.runnerUp.team.id,
    semifinalTeamIds: collectRoundTeamIds(rounds.semifinals),
    thirdPlaceTeamId: rounds.summary.thirdPlace.team.id,
  };
}

function buildPlacementBonusByTeamId(
  summary: KnockoutSummary,
  bonusBreakdown: TournamentBonusBreakdownResult | null,
) {
  if (bonusBreakdown?.status !== "complete") {
    return undefined;
  }

  const entries: Array<[string, TeamBonusBadge]> = [];

  if (summary.champion) {
    entries.push([
      summary.champion.team.id,
      {
        hit: bonusBreakdown.placements.champion.hit,
        label: "Campeón",
        points: bonusBreakdown.placements.champion.possiblePoints,
        variant: "placement",
      },
    ]);
  }

  if (summary.runnerUp) {
    entries.push([
      summary.runnerUp.team.id,
      {
        hit: bonusBreakdown.placements.runnerUp.hit,
        label: "Subcampeón",
        points: bonusBreakdown.placements.runnerUp.possiblePoints,
        variant: "placement",
      },
    ]);
  }

  if (summary.thirdPlace) {
    entries.push([
      summary.thirdPlace.team.id,
      {
        hit: bonusBreakdown.placements.thirdPlace.hit,
        label: "3.º",
        points: bonusBreakdown.placements.thirdPlace.possiblePoints,
        variant: "placement",
      },
    ]);
  }

  if (summary.fourthPlace) {
    entries.push([
      summary.fourthPlace.team.id,
      {
        hit: bonusBreakdown.placements.fourthPlace.hit,
        label: "4.º",
        points: bonusBreakdown.placements.fourthPlace.possiblePoints,
        variant: "placement",
      },
    ]);
  }

  return new Map(entries);
}

function RoundSection({
  disabled,
  matches,
  onSelect,
  stageBonus,
  selections,
  title,
}: {
  disabled?: boolean;
  matches: DerivedKnockoutMatch[];
  onSelect: (matchupId: string, teamId: string) => void;
  stageBonus?: StageBonusDetails | null;
  selections: KnockoutSelectionMap;
  title: string;
}) {
  const bonusByTeamId = stageBonus
    ? new Map(
        stageBonus.items.map((item) => [
          item.teamId,
          {
            hit: item.hit,
            label: getStageTeamBonusStatusLabel(item.hit),
            variant: "stage" as const,
          },
        ]),
      )
    : undefined;
  const stageBonusLabel = stageBonus
    ? getStageBonusBadgeLabel(stageBonus.pointsPerHit)
    : undefined;

  return (
    <section className="space-y-4">
      <div className="border-y-[3px] border-prode-black bg-prode-yellow px-4 py-3 shadow-[6px_6px_0_var(--prode-black)]">
        <h3 className="font-display text-4xl uppercase leading-none">{title}</h3>
      </div>

      {matches.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-4">
          {matches.map((matchup) => (
            <SelectableMatchCard
              bonusByTeamId={bonusByTeamId}
              disabled={disabled}
              key={matchup.id}
              matchup={matchup}
              onSelect={onSelect}
              stageBonusLabel={stageBonusLabel}
              selections={selections}
            />
          ))}
        </div>
      ) : (
        <PendingRoundState />
      )}
    </section>
  );
}

function FinalRoundSection({
  disabled,
  final,
  onSelect,
  placementBonusByTeamId,
  selections,
  thirdPlace,
}: {
  disabled?: boolean;
  final: DerivedKnockoutMatch[];
  onSelect: (matchupId: string, teamId: string) => void;
  placementBonusByTeamId?: Map<string, TeamBonusBadge>;
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
              bonusByTeamId={placementBonusByTeamId}
              disabled={disabled}
              key={matchup.id}
              matchup={matchup}
              onSelect={onSelect}
              selections={selections}
            />
          ))}
        </div>
      ) : (
        <PendingRoundState />
      )}
    </section>
  );
}

function SummaryItem({
  bonus,
  label,
  slot,
}: {
  bonus?: TeamBonusBadge;
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
      {bonus && (
        <span
          className={cn(
            "prode-frame mt-3 inline-flex px-2 py-1 font-technical text-[0.62rem] font-black uppercase",
            bonus.hit ? "bg-prode-yellow text-prode-black" : "bg-prode-surface",
          )}
        >
          {bonus.label}: {bonus.hit ? `+${bonus.points}` : "+0"}
        </span>
      )}
    </div>
  );
}

function ChampionSummaryItem({
  bonus,
  slot,
}: {
  bonus?: TeamBonusBadge;
  slot: ProjectedBracketSlot | null;
}) {
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
      {bonus && (
        <span className="prode-frame mt-4 inline-flex bg-prode-surface px-3 py-2 font-technical text-xs font-black uppercase">
          Campeón exacto: {bonus.hit ? `+${bonus.points}` : "+0"}
        </span>
      )}
    </div>
  );
}

function SummaryCard({
  isBracketComplete,
  isLocked,
  isPending,
  lockedAt,
  onSave,
  placementBonusByTeamId,
  bonusBreakdown,
  savedAt,
  saveMessage,
  saveStatus,
  summary,
}: {
  isBracketComplete: boolean;
  isLocked: boolean;
  isPending: boolean;
  lockedAt: string | null;
  onSave: () => void;
  placementBonusByTeamId?: Map<string, TeamBonusBadge>;
  bonusBreakdown: TournamentBonusBreakdownResult | null;
  savedAt: string | null;
  saveMessage: string;
  saveStatus: "dirty" | "error" | "locked" | "saved" | "unsaved";
  summary: KnockoutSummary;
}) {
  const bonus = getBracketBonusPreview();
  const bonusSummary = getBonusSummarySegments(bonusBreakdown);
  const statusLabel = isLocked
    ? "Predicción bloqueada"
    : saveStatus === "saved"
      ? "Mi Mundial guardado"
      : saveStatus === "dirty"
        ? "Cambios sin guardar"
        : "No guardado todavía";
  const canSave = !isLocked && isBracketComplete;

  return (
    <section className="prode-frame prode-hard-shadow bg-prode-surface p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="prode-frame bg-prode-yellow px-3 py-2 font-technical text-xs font-black uppercase">
            {statusLabel}
          </span>
          <h3 className="mt-4 font-display text-5xl uppercase leading-none">
            Resumen de Mi Mundial
          </h3>
        </div>
        <div className="prode-frame bg-prode-yellow px-4 py-3 font-technical text-sm font-black uppercase">
          {bonusSummary.total
            ? `${bonusSummary.total.label}: ${bonusSummary.total.earnedPoints} / ${bonusSummary.total.maxPoints} pts`
            : `Bonus máximo posible: ${bonus.maxPossiblePoints} puntos`}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <ChampionSummaryItem
          bonus={
            summary.champion
              ? placementBonusByTeamId?.get(summary.champion.team.id)
              : undefined
          }
          slot={summary.champion}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-1">
          <SummaryItem
            bonus={
              summary.runnerUp
                ? placementBonusByTeamId?.get(summary.runnerUp.team.id)
                : undefined
            }
            label="Subcampeón"
            slot={summary.runnerUp}
          />
          <SummaryItem
            bonus={
              summary.thirdPlace
                ? placementBonusByTeamId?.get(summary.thirdPlace.team.id)
                : undefined
            }
            label="3.º"
            slot={summary.thirdPlace}
          />
          <SummaryItem
            bonus={
              summary.fourthPlace
                ? placementBonusByTeamId?.get(summary.fourthPlace.team.id)
                : undefined
            }
            label="4.º"
            slot={summary.fourthPlace}
          />
        </div>
      </div>

      {bonusBreakdown?.status === "pending" && (
        <div className="prode-frame mt-5 bg-[#f7f4df] px-4 py-3 font-technical text-xs font-black uppercase text-muted-foreground">
          {bonusBreakdown.message}
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-2 lg:grid-cols-2 xl:grid-cols-4">
        {bonusSummary.segments.map((segment) => (
          <div
            className={cn(
              "border-[2px] border-prode-black/40 px-3 py-2 font-technical text-[0.68rem] font-black uppercase",
              bonusSummary.status === "complete" &&
                segment.earnedPoints !== null &&
                segment.earnedPoints > 0
                ? "bg-prode-yellow text-prode-black"
                : "bg-[#f7f4df] text-muted-foreground",
            )}
            key={segment.label}
          >
            {segment.label}: {segment.displayValue}
          </div>
        ))}
      </div>

      <div className="mt-5 border-t-[3px] border-prode-black pt-5">
        <p
          className={cn(
            "mb-3 font-technical text-xs font-black uppercase",
            saveStatus === "error" ? "text-red-700" : "text-muted-foreground",
          )}
        >
          {saveMessage}
        </p>
        {lockedAt && (
          <p className="mb-3 font-body text-sm text-muted-foreground">
            Cierre de Mi Mundial:{" "}
            {new Intl.DateTimeFormat("es-AR", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(lockedAt))}
          </p>
        )}
        {savedAt && !isLocked && (
          <p className="mb-3 font-body text-sm text-muted-foreground">
            Último guardado:{" "}
            {new Intl.DateTimeFormat("es-AR", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(savedAt))}
          </p>
        )}
        <p className="mb-4 max-w-3xl font-body text-sm leading-6 text-muted-foreground">
          Cuando se bloquee, las llaves de otros jugadores podrán verse desde
          rankings/perfiles en una próxima vista.
        </p>
      </div>

      <ProdeButton
        className="mt-1"
        disabled={!canSave || isPending}
        onClick={onSave}
      >
        {isLocked
          ? "Predicción bloqueada"
          : isPending
            ? "Guardando..."
            : "Guardar Mi Mundial"}
      </ProdeButton>
    </section>
  );
}

export function InteractiveKnockoutBracket({
  bracket,
  bonusActualOutcomeResult,
  initialSaveState,
  initialSelections,
  isLocked,
  lockedAt,
  saveAction,
  savedAt,
}: InteractiveKnockoutBracketProps) {
  const [selections, setSelections] =
    useState<KnockoutSelectionMap>(initialSelections);
  const [isPending, startTransition] = useTransition();
  const [saveState, setSaveState] = useState<{
    message: string;
    savedAt: string | null;
    status: "dirty" | "error" | "locked" | "saved" | "unsaved";
  }>(() => {
    if (initialSaveState === "locked") {
      return {
        message: "Predicción bloqueada",
        savedAt,
        status: "locked",
      };
    }

    if (initialSaveState === "saved") {
      return {
        message: "Mi Mundial guardado",
        savedAt,
        status: "saved",
      };
    }

    return {
      message: "Completá la llave y guardá tu predicción pre-torneo.",
      savedAt: null,
      status: "unsaved",
    };
  });
  const rounds = useMemo(
    () => buildDerivedKnockoutRounds(bracket.roundOf32, selections),
    [bracket.roundOf32, selections],
  );
  const currentBonusPrediction = useMemo(
    () => buildBonusPredictionFromRounds(rounds),
    [rounds],
  );
  const bonusBreakdown = useMemo(
    () =>
      currentBonusPrediction
        ? buildTournamentBonusBreakdown(
            currentBonusPrediction,
            bonusActualOutcomeResult,
          )
        : null,
    [bonusActualOutcomeResult, currentBonusPrediction],
  );
  const placementBonusByTeamId = useMemo(
    () => buildPlacementBonusByTeamId(rounds.summary, bonusBreakdown),
    [bonusBreakdown, rounds.summary],
  );
  const isInteractionLocked = isLocked || saveState.status === "locked";
  const handleSelect = (matchupId: string, teamId: string) => {
    if (isInteractionLocked) {
      return;
    }

    setSelections((current) => ({
      ...current,
      [matchupId]: teamId,
    }));
    setSaveState((current) =>
      current.status !== "locked"
        ? {
            message: "Tenés cambios sin guardar.",
            savedAt: current.savedAt,
            status: "dirty",
          }
        : current,
    );
  };
  const handleSave = () => {
    startTransition(async () => {
      const result = await saveAction({ selections });

      setSaveState((current) => ({
        message: result.message,
        savedAt: result.savedAt ?? current.savedAt,
        status:
          result.status === "success"
            ? "saved"
            : result.message === "La predicción ya está bloqueada"
              ? "locked"
              : "error",
      }));
    });
  };

  return (
    <section className="space-y-8">
      <div className="prode-frame prode-hard-shadow bg-prode-surface p-5">
        <div className="max-w-4xl">
          <span className="prode-frame bg-prode-yellow px-3 py-2 font-technical text-xs font-black uppercase">
            Predicción guardable
          </span>
          <h2 className="mt-4 font-display text-5xl uppercase leading-none">
            Completá tu llave
          </h2>
          <p className="mt-3 font-body text-base leading-7 text-muted-foreground">
            Elegí quién avanza en cada cruce y guardá tu Mi Mundial completo
            antes del inicio del torneo.
          </p>
        </div>
      </div>

      <RoundSection
        disabled={isInteractionLocked || bracket.status !== "complete"}
        matches={rounds.roundOf32}
        onSelect={handleSelect}
        selections={selections}
        title="16avos"
      />
      <RoundSection
        disabled={isInteractionLocked}
        matches={rounds.roundOf16}
        onSelect={handleSelect}
        stageBonus={
          bonusBreakdown?.status === "complete"
            ? bonusBreakdown.stages.octavos
            : null
        }
        selections={selections}
        title="Octavos"
      />
      <RoundSection
        disabled={isInteractionLocked}
        matches={rounds.quarterfinals}
        onSelect={handleSelect}
        stageBonus={
          bonusBreakdown?.status === "complete"
            ? bonusBreakdown.stages.cuartos
            : null
        }
        selections={selections}
        title="Cuartos"
      />
      <RoundSection
        disabled={isInteractionLocked}
        matches={rounds.semifinals}
        onSelect={handleSelect}
        stageBonus={
          bonusBreakdown?.status === "complete"
            ? bonusBreakdown.stages.semifinales
            : null
        }
        selections={selections}
        title="Semifinales"
      />
      <FinalRoundSection
        disabled={isInteractionLocked}
        final={rounds.final}
        onSelect={handleSelect}
        placementBonusByTeamId={placementBonusByTeamId}
        selections={selections}
        thirdPlace={rounds.thirdPlace}
      />
      <SummaryCard
        isBracketComplete={
          Boolean(
            rounds.summary.champion &&
              rounds.summary.runnerUp &&
              rounds.summary.thirdPlace &&
              rounds.summary.fourthPlace,
          ) && bracket.status === "complete"
        }
        isLocked={isInteractionLocked}
        isPending={isPending}
        lockedAt={lockedAt}
        onSave={handleSave}
        placementBonusByTeamId={placementBonusByTeamId}
        bonusBreakdown={bonusBreakdown}
        savedAt={saveState.savedAt}
        saveMessage={saveState.message}
        saveStatus={saveState.status}
        summary={rounds.summary}
      />
    </section>
  );
}

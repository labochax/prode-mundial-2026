import type {
  DerivedKnockoutMatch,
  DerivedKnockoutRounds,
  KnockoutSelectionMap,
} from "@/lib/tournament/knockout-selection";
import type { ProjectedBracketSlot } from "@/lib/tournament/types";
import { cn } from "@/lib/utils";

type ReadOnlyTournamentBracketProps = {
  bonusPoints: number;
  rounds: DerivedKnockoutRounds;
  selections?: KnockoutSelectionMap;
};

function PlacementCard({
  emphasized,
  label,
  slot,
}: {
  emphasized?: boolean;
  label: string;
  slot: ProjectedBracketSlot | null;
}) {
  return (
    <div
      className={cn(
        "prode-frame p-4",
        emphasized
          ? "prode-hard-shadow bg-prode-yellow"
          : "bg-[#f7f4df]",
      )}
    >
      <p className="font-technical text-xs font-black uppercase text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 break-words font-technical font-black uppercase",
          emphasized ? "text-3xl" : "text-lg",
        )}
      >
        {slot?.team.name ?? "Por definir"}
      </p>
    </div>
  );
}

function ReadOnlyMatchCard({
  matchup,
  selectedTeamId,
}: {
  matchup: DerivedKnockoutMatch;
  selectedTeamId?: string;
}) {
  return (
    <article className="prode-frame bg-prode-surface p-3">
      <header className="mb-3 flex items-center justify-between gap-2 border-b-[3px] border-prode-black pb-2">
        <span className="font-technical text-xs font-black uppercase">
          {matchup.slotLabel}
        </span>
        <span className="prode-frame bg-prode-yellow px-2 py-1 font-technical text-[0.62rem] font-black uppercase">
          {matchup.roundLabel}
        </span>
      </header>
      <div className="space-y-2">
        {[matchup.home, matchup.away].map((slot) => {
          const isSelected = slot.team.id === selectedTeamId;

          return (
            <div
              className={cn(
                "border-[3px] border-prode-black p-3",
                isSelected
                  ? "bg-[#eee4a8] shadow-[3px_3px_0_var(--prode-black)]"
                  : "bg-[#f7f4df] text-muted-foreground",
              )}
              key={`${matchup.id}-${slot.team.id}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-technical text-sm font-black uppercase">
                    {slot.team.name}
                  </p>
                  <p className="mt-1 font-technical text-[0.62rem] font-bold uppercase">
                    {slot.originLabel}
                  </p>
                </div>
                {isSelected && (
                  <span className="shrink-0 border-2 border-prode-black bg-prode-yellow px-2 py-1 font-technical text-[0.56rem] font-black uppercase">
                    Seleccionado
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function RoundSection({
  matches,
  selections,
  title,
}: {
  matches: DerivedKnockoutMatch[];
  selections: KnockoutSelectionMap;
  title: string;
}) {
  return (
    <section className="space-y-4">
      <div className="border-y-[3px] border-prode-black bg-prode-yellow px-4 py-3 shadow-[5px_5px_0_var(--prode-black)]">
        <h2 className="font-display text-4xl uppercase leading-none">{title}</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-4">
        {matches.map((matchup) => (
          <ReadOnlyMatchCard
            key={matchup.id}
            matchup={matchup}
            selectedTeamId={selections[matchup.id]}
          />
        ))}
      </div>
    </section>
  );
}

export function ReadOnlyTournamentBracket({
  bonusPoints,
  rounds,
  selections = {},
}: ReadOnlyTournamentBracketProps) {
  return (
    <div className="space-y-8">
      <section className="prode-frame prode-hard-shadow bg-prode-surface p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="prode-frame bg-prode-yellow px-3 py-2 font-technical text-xs font-black uppercase">
              Mi Mundial guardado
            </span>
            <h2 className="mt-4 font-display text-5xl uppercase leading-none">
              Resumen de Mi Mundial
            </h2>
          </div>
          <span className="prode-frame bg-prode-black px-4 py-3 font-technical text-sm font-black uppercase text-prode-yellow">
            Bonus Mi Mundial: {bonusPoints}{" "}
            {bonusPoints === 1 ? "punto" : "puntos"}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <PlacementCard
            emphasized
            label="Campeón"
            slot={rounds.summary.champion}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <PlacementCard label="Subcampeón" slot={rounds.summary.runnerUp} />
            <PlacementCard label="3.º" slot={rounds.summary.thirdPlace} />
            <PlacementCard label="4.º" slot={rounds.summary.fourthPlace} />
          </div>
        </div>
      </section>

      <RoundSection
        matches={rounds.roundOf32}
        selections={selections}
        title="16avos de final"
      />
      <RoundSection
        matches={rounds.roundOf16}
        selections={selections}
        title="Octavos"
      />
      <RoundSection
        matches={rounds.quarterfinals}
        selections={selections}
        title="Cuartos"
      />
      <RoundSection
        matches={rounds.semifinals}
        selections={selections}
        title="Semifinales"
      />
      <RoundSection
        matches={rounds.thirdPlace}
        selections={selections}
        title="3.º puesto"
      />
      <RoundSection
        matches={rounds.final}
        selections={selections}
        title="Final"
      />
    </div>
  );
}

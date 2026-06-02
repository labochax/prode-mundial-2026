import type { ReactNode } from "react";

import type {
  RankedThirdPlacedTeam,
  TournamentGroupSimulation,
  TournamentStandingRow,
} from "@/lib/tournament/types";
import { cn } from "@/lib/utils";

function StatCell({
  children,
  emphasis,
}: {
  children: ReactNode;
  emphasis?: boolean;
}) {
  return (
    <span
      className={cn(
        "text-center font-technical text-xs font-black tabular-nums",
        emphasis && "bg-prode-yellow px-1 py-0.5 text-prode-black",
      )}
    >
      {children}
    </span>
  );
}

function TeamName({ team }: { team: TournamentStandingRow["team"] }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      {team.badgeUrl && (
        <span className="prode-frame flex size-6 shrink-0 items-center justify-center overflow-hidden bg-prode-surface">
          <img
            alt={`Escudo de ${team.name}`}
            className="size-full object-contain p-0.5"
            loading="lazy"
            referrerPolicy="no-referrer"
            src={team.badgeUrl}
          />
        </span>
      )}
      <span className="truncate font-technical text-[0.68rem] font-black uppercase">
        {team.name}
      </span>
    </div>
  );
}

function GroupTable({
  bestThirdQualifiedTeamIds,
  group,
}: {
  bestThirdQualifiedTeamIds: Set<string>;
  group: TournamentGroupSimulation;
}) {
  return (
    <article className="prode-frame prode-hard-shadow overflow-hidden bg-prode-surface">
      <header className="border-b-[3px] border-prode-black bg-prode-yellow p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-display text-4xl uppercase leading-none">
            {group.groupLabel}
          </h3>
          <span className="prode-frame bg-prode-surface px-2 py-1 font-technical text-[0.62rem] font-black uppercase">
            {group.predictionsCompleted}/{group.predictionsTotal} cargados
          </span>
        </div>
        {!group.isComplete && (
          <p className="mt-2 border-t-[2px] border-prode-black pt-2 font-technical text-[0.62rem] font-black uppercase">
            Te faltan pronósticos para completar este grupo.
          </p>
        )}
      </header>

      <div className="overflow-x-auto">
        <div className="min-w-[35rem]">
          <div className="grid grid-cols-[minmax(7rem,1fr)_repeat(8,2rem)_5rem] gap-1 border-b-[3px] border-prode-black bg-prode-black px-2 py-2 font-technical text-[0.58rem] font-black uppercase text-prode-yellow">
            <span>Equipo</span>
            {["PJ", "G", "E", "P", "GF", "GC", "DG", "PTS"].map((label) => (
              <span className="text-center" key={label}>
                {label}
              </span>
            ))}
            <span className="text-center">Estado</span>
          </div>
          {group.rows.map((row) => {
            const qualifiesDirectly = row.rank <= 2;
            const qualifiesAsThird =
              row.rank === 3 && bestThirdQualifiedTeamIds.has(row.team.id);

            return (
              <div
                className={cn(
                  "grid grid-cols-[minmax(7rem,1fr)_repeat(8,2rem)_5rem] items-center gap-1 border-b-[2px] border-prode-black/30 px-2 py-2 last:border-b-0",
                  (qualifiesDirectly || qualifiesAsThird) && "bg-[#fff7b5]",
                )}
                key={row.team.id}
              >
                <div className="flex min-w-0 items-center gap-1">
                  <span className="font-technical text-[0.62rem] font-black">
                    {row.rank}.
                  </span>
                  <TeamName team={row.team} />
                </div>
                <StatCell>{row.played}</StatCell>
                <StatCell>{row.wins}</StatCell>
                <StatCell>{row.draws}</StatCell>
                <StatCell>{row.losses}</StatCell>
                <StatCell>{row.goalsFor}</StatCell>
                <StatCell>{row.goalsAgainst}</StatCell>
                <StatCell>{row.goalDifference}</StatCell>
                <StatCell emphasis>{row.points}</StatCell>
                <span className="text-center font-technical text-[0.54rem] font-black uppercase">
                  {qualifiesDirectly
                    ? "Clasifica"
                    : qualifiesAsThird
                      ? "3.º"
                      : "-"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}

export function GroupProjectionView({
  groups,
  thirdPlacedTeams,
}: {
  groups: TournamentGroupSimulation[];
  thirdPlacedTeams: RankedThirdPlacedTeam[];
}) {
  const bestThirdQualifiedTeamIds = new Set(
    thirdPlacedTeams.filter((row) => row.isQualified).map((row) => row.team.id),
  );

  return (
    <>
      <section className="space-y-5">
        <div className="border-y-[3px] border-prode-black bg-prode-yellow px-4 py-3 shadow-[6px_6px_0_var(--prode-black)]">
          <h2 className="font-display text-5xl uppercase leading-none">Mis grupos</h2>
        </div>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {groups.map((group) => (
            <GroupTable
              bestThirdQualifiedTeamIds={bestThirdQualifiedTeamIds}
              group={group}
              key={group.groupCode}
            />
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div className="border-y-[3px] border-prode-black bg-prode-yellow px-4 py-3 shadow-[6px_6px_0_var(--prode-black)]">
          <h2 className="font-display text-5xl uppercase leading-none">
            Mejores terceros
          </h2>
        </div>
        {thirdPlacedTeams.length > 0 ? (
          <div className="prode-frame prode-hard-shadow overflow-x-auto bg-prode-surface">
            <div className="min-w-[38rem]">
              <div className="grid grid-cols-[2rem_minmax(8rem,1fr)_4rem_repeat(4,2.5rem)_5.5rem] gap-1 border-b-[3px] border-prode-black bg-prode-black px-2 py-2 font-technical text-[0.58rem] font-black uppercase text-prode-yellow">
                <span>#</span>
                <span>Equipo</span>
                <span className="text-center">PTS</span>
                <span className="text-center">DG</span>
                <span className="text-center">GF</span>
                <span className="text-center">GC</span>
                <span className="text-center">PJ</span>
                <span className="text-center">Estado</span>
              </div>
              {thirdPlacedTeams.map((row) => (
                <div
                  className={cn(
                    "grid grid-cols-[2rem_minmax(8rem,1fr)_4rem_repeat(4,2.5rem)_5.5rem] items-center gap-1 border-b-[2px] border-prode-black/30 px-2 py-2 last:border-b-0",
                    row.isQualified && "bg-[#fff7b5]",
                  )}
                  key={row.team.id}
                >
                  <span className="font-display text-2xl">{row.thirdRank}</span>
                  <div className="min-w-0">
                    <TeamName team={row.team} />
                    <p className="font-technical text-[0.55rem] font-bold uppercase text-muted-foreground">
                      {row.groupLabel}
                    </p>
                  </div>
                  <StatCell emphasis>{row.points}</StatCell>
                  <StatCell>{row.goalDifference}</StatCell>
                  <StatCell>{row.goalsFor}</StatCell>
                  <StatCell>{row.goalsAgainst}</StatCell>
                  <StatCell>{row.played}</StatCell>
                  <span className="text-center font-technical text-[0.56rem] font-black uppercase">
                    {row.isQualified ? "Clasifica" : "Eliminado"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="prode-frame prode-hard-shadow bg-prode-surface p-5">
            <h3 className="font-display text-4xl uppercase leading-none">
              Todavía no hay terceros para comparar.
            </h3>
          </div>
        )}
      </section>
    </>
  );
}

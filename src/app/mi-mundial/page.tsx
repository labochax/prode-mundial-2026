import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AuthenticatedAppShell } from "@/components/layout/authenticated-app-shell";
import { ProdeBadge } from "@/components/prode/prode-badge";
import type { MatchWithRelations } from "@/lib/matches/prediction-match";
import { ensureCurrentProfile } from "@/lib/supabase/profile-bootstrap";
import { getActiveUpcomingMatchesWithDetails } from "@/lib/supabase/queries/matches";
import { getPredictionsForMatches } from "@/lib/supabase/queries/predictions";
import { getOrJoinDefaultPool } from "@/lib/supabase/queries/pools";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rankThirdPlacedTeams } from "@/lib/tournament/rank-third-placed";
import { simulateGroupTables } from "@/lib/tournament/simulate-groups";
import type {
  RankedThirdPlacedTeam,
  TournamentGroupMatch,
  TournamentGroupSimulation,
  TournamentStandingRow,
  TournamentTeam,
} from "@/lib/tournament/types";
import { cn } from "@/lib/utils";

function isGroupStageMatch(match: MatchWithRelations) {
  return (match.stage ?? "").toUpperCase().includes("GROUP");
}

function mapTeam(
  team: MatchWithRelations["home_team"],
  fallbackId: string,
): TournamentTeam {
  return {
    code: team?.tla ?? team?.short_name ?? null,
    id: team?.id ?? fallbackId,
    name: team?.name_es ?? team?.name_en ?? "Equipo a confirmar",
  };
}

function getGroupStagePredictionMatches(
  matches: MatchWithRelations[],
  predictionsByMatchId: Awaited<ReturnType<typeof getPredictionsForMatches>>,
): TournamentGroupMatch[] {
  return matches.filter(isGroupStageMatch).map((match) => {
    const prediction = predictionsByMatchId.get(match.id) ?? null;

    return {
      awayTeam: mapTeam(match.away_team, `${match.id}-away`),
      groupCode: match.group_code ?? "GROUP",
      homeTeam: mapTeam(match.home_team, `${match.id}-home`),
      id: match.id,
      prediction: prediction
        ? {
            awayScore: prediction.predicted_away_score,
            homeScore: prediction.predicted_home_score,
          }
        : null,
    };
  });
}

function StatHeader() {
  return (
    <div className="grid grid-cols-[minmax(9rem,1fr)_repeat(8,2.5rem)_6.2rem] gap-1 border-b-[3px] border-prode-black bg-prode-black px-2 py-2 font-technical text-[0.65rem] font-black uppercase text-prode-yellow">
      <span>Equipo</span>
      <span className="text-center">PJ</span>
      <span className="text-center">G</span>
      <span className="text-center">E</span>
      <span className="text-center">P</span>
      <span className="text-center">GF</span>
      <span className="text-center">GC</span>
      <span className="text-center">DG</span>
      <span className="text-center">PTS</span>
      <span className="text-center">Estado</span>
    </div>
  );
}

function StatCell({ children }: { children: ReactNode }) {
  return <span className="text-center font-technical font-black">{children}</span>;
}

function GroupRow({
  bestThirdQualifiedTeamIds,
  row,
}: {
  bestThirdQualifiedTeamIds: Set<string>;
  row: TournamentStandingRow;
}) {
  const isDirectQualifier = row.rank <= 2;
  const isBestThird = row.rank === 3 && bestThirdQualifiedTeamIds.has(row.team.id);
  const status = isDirectQualifier
    ? "Clasifica"
    : isBestThird
      ? "Mejor tercero"
      : "Pendiente";

  return (
    <div
      className={cn(
        "grid grid-cols-[minmax(9rem,1fr)_repeat(8,2.5rem)_6.2rem] gap-1 border-b-[2px] border-prode-black/35 px-2 py-2 text-sm last:border-b-0",
        (isDirectQualifier || isBestThird) && "bg-[#fff7b5]",
      )}
    >
      <div className="min-w-0">
        <p className="truncate font-technical text-xs font-black uppercase">
          {row.rank}. {row.team.name}
        </p>
        {row.team.code && (
          <p className="font-technical text-[0.62rem] font-bold uppercase text-muted-foreground">
            {row.team.code}
          </p>
        )}
      </div>
      <StatCell>{row.played}</StatCell>
      <StatCell>{row.wins}</StatCell>
      <StatCell>{row.draws}</StatCell>
      <StatCell>{row.losses}</StatCell>
      <StatCell>{row.goalsFor}</StatCell>
      <StatCell>{row.goalsAgainst}</StatCell>
      <StatCell>{row.goalDifference}</StatCell>
      <StatCell>{row.points}</StatCell>
      <span
        className={cn(
          "self-center border-[2px] border-prode-black px-1 py-1 text-center font-technical text-[0.58rem] font-black uppercase",
          isDirectQualifier || isBestThird
            ? "bg-prode-yellow"
            : "bg-prode-surface text-muted-foreground",
        )}
      >
        {status}
      </span>
    </div>
  );
}

function GroupCard({
  bestThirdQualifiedTeamIds,
  group,
}: {
  bestThirdQualifiedTeamIds: Set<string>;
  group: TournamentGroupSimulation;
}) {
  return (
    <article className="prode-frame prode-hard-shadow overflow-hidden bg-prode-surface">
      <header className="border-b-[3px] border-prode-black bg-prode-yellow p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-display text-5xl uppercase leading-none text-prode-black">
            {group.groupLabel}
          </h3>
          <span className="prode-frame bg-prode-surface px-3 py-2 font-technical text-xs font-black uppercase">
            Pronósticos cargados: {group.predictionsCompleted}/
            {group.predictionsTotal}
          </span>
        </div>
        {!group.isComplete && (
          <p className="mt-3 border-t-[3px] border-prode-black pt-3 font-technical text-xs font-black uppercase text-prode-black">
            Te faltan pronósticos para completar este grupo.
          </p>
        )}
      </header>

      <div className="overflow-x-auto">
        <div className="min-w-[46rem]">
          <StatHeader />
          {group.rows.map((row) => (
            <GroupRow
              bestThirdQualifiedTeamIds={bestThirdQualifiedTeamIds}
              key={row.team.id}
              row={row}
            />
          ))}
        </div>
      </div>
    </article>
  );
}

function BestThirdRow({ row }: { row: RankedThirdPlacedTeam }) {
  return (
    <div
      className={cn(
        "grid grid-cols-[3rem_minmax(10rem,1fr)_7rem_repeat(4,3rem)_7rem] gap-2 border-b-[2px] border-prode-black/35 px-3 py-3 text-sm last:border-b-0",
        row.isQualified && "bg-[#fff7b5]",
      )}
    >
      <span className="font-display text-3xl leading-none">{row.thirdRank}</span>
      <div className="min-w-0">
        <p className="truncate font-technical text-xs font-black uppercase">
          {row.team.name}
        </p>
        <p className="font-technical text-[0.62rem] font-bold uppercase text-muted-foreground">
          {row.groupLabel}
        </p>
      </div>
      <StatCell>{row.points} pts</StatCell>
      <StatCell>{row.goalDifference}</StatCell>
      <StatCell>{row.goalsFor}</StatCell>
      <StatCell>{row.goalsAgainst}</StatCell>
      <StatCell>{row.played}</StatCell>
      <span
        className={cn(
          "self-center border-[2px] border-prode-black px-2 py-1 text-center font-technical text-[0.62rem] font-black uppercase",
          row.isQualified
            ? "bg-prode-yellow"
            : "bg-prode-surface text-muted-foreground",
        )}
      >
        {row.isQualified ? "Clasifica" : "Eliminado"}
      </span>
    </div>
  );
}

export default async function MyWorldCupPage() {
  const supabase = await createSupabaseServerClient();
  const current = await ensureCurrentProfile(supabase);

  if (!current) {
    redirect("/login");
  }

  const pool = await getOrJoinDefaultPool(supabase);
  const { matches } = await getActiveUpcomingMatchesWithDetails(supabase);
  const groupMatches = matches.filter(isGroupStageMatch);
  const predictionsByMatchId = await getPredictionsForMatches(
    supabase,
    pool.id,
    groupMatches.map((match) => match.id),
  );
  const simulationMatches = getGroupStagePredictionMatches(
    groupMatches,
    predictionsByMatchId,
  );
  const groups = simulateGroupTables(simulationMatches);
  const thirdPlacedTeams = rankThirdPlacedTeams(groups);
  const bestThirdQualifiedTeamIds = new Set(
    thirdPlacedTeams
      .filter((row) => row.isQualified)
      .map((row) => row.team.id),
  );
  const completedPredictions = groups.reduce(
    (total, group) => total + group.predictionsCompleted,
    0,
  );
  const totalPredictions = groups.reduce(
    (total, group) => total + group.predictionsTotal,
    0,
  );
  const hasPredictions = completedPredictions > 0;

  return (
    <AuthenticatedAppShell className="max-w-[92rem] gap-10">
      <section className="prode-frame prode-hard-shadow bg-prode-surface p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-4xl space-y-4">
            <ProdeBadge variant="primary">Proyección privada</ProdeBadge>
            <h1 className="font-display text-6xl uppercase leading-[0.9] text-prode-black sm:text-7xl lg:text-8xl">
              Mi Mundial
            </h1>
            <p className="max-w-3xl font-body text-base leading-7 text-muted-foreground">
              Una proyección privada basada en tus pronósticos. Las tablas se
              recalculan con tus marcadores cargados y no modifican el ranking
              del Prode.
            </p>
          </div>

          <Link
            className="prode-frame prode-hard-shadow prode-pressable inline-flex w-fit items-center justify-center bg-prode-yellow px-4 py-3 font-technical text-xs font-black uppercase text-prode-black outline-none focus-visible:ring-[3px] focus-visible:ring-prode-black focus-visible:ring-offset-[3px] focus-visible:ring-offset-prode-paper"
            href="/dashboard"
          >
            Cargar más pronósticos
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="prode-frame bg-[#f7f4df] p-3">
            <p className="font-technical text-[0.68rem] font-black uppercase text-muted-foreground">
              Pronósticos
            </p>
            <p className="mt-1 font-technical text-3xl font-black">
              {completedPredictions}/{totalPredictions}
            </p>
          </div>
          <div className="prode-frame bg-[#f7f4df] p-3">
            <p className="font-technical text-[0.68rem] font-black uppercase text-muted-foreground">
              Grupos
            </p>
            <p className="mt-1 font-technical text-3xl font-black">
              {groups.length}
            </p>
          </div>
          <div className="prode-frame bg-prode-yellow p-3">
            <p className="font-technical text-[0.68rem] font-black uppercase">
              Clasifican terceros
            </p>
            <p className="mt-1 font-technical text-3xl font-black">8</p>
          </div>
        </div>
      </section>

      {!hasPredictions && (
        <section className="prode-frame prode-hard-shadow bg-prode-yellow p-5 text-prode-black">
          <h2 className="font-display text-4xl uppercase leading-none">
            Cargá pronósticos en el panel para empezar a simular tu Mundial.
          </h2>
          <p className="mt-3 max-w-2xl font-body text-base">
            Cuando guardes marcadores de fase de grupos, esta vista va a armar
            tus tablas, clasificados y mejores terceros.
          </p>
        </section>
      )}

      {hasPredictions && (
        <>
          <section className="space-y-6">
            <div className="border-y-[3px] border-prode-black bg-prode-yellow px-4 py-3 shadow-[6px_6px_0_var(--prode-black)]">
              <h2 className="font-display text-5xl uppercase leading-none">
                Mis grupos
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {groups.map((group) => (
                <GroupCard
                  bestThirdQualifiedTeamIds={bestThirdQualifiedTeamIds}
                  group={group}
                  key={group.groupCode}
                />
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <div className="border-y-[3px] border-prode-black bg-prode-yellow px-4 py-3 shadow-[6px_6px_0_var(--prode-black)]">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="font-display text-5xl uppercase leading-none">
                  Mejores terceros
                </h2>
                <span className="font-technical text-xs font-black uppercase">
                  Top 8 clasifican
                </span>
              </div>
            </div>

            {thirdPlacedTeams.length > 0 ? (
              <div className="prode-frame prode-hard-shadow overflow-x-auto bg-prode-surface">
                <div className="min-w-[48rem]">
                  <div className="grid grid-cols-[3rem_minmax(10rem,1fr)_7rem_repeat(4,3rem)_7rem] gap-2 border-b-[3px] border-prode-black bg-prode-black px-3 py-2 font-technical text-[0.65rem] font-black uppercase text-prode-yellow">
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
                    <BestThirdRow key={row.team.id} row={row} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="prode-frame prode-hard-shadow bg-prode-surface p-5">
                <h3 className="font-display text-4xl uppercase leading-none">
                  Todavía no hay terceros para comparar.
                </h3>
                <p className="mt-3 max-w-2xl font-body text-base">
                  Cargá más pronósticos de fase de grupos para armar esta tabla.
                </p>
              </div>
            )}
          </section>
        </>
      )}
    </AuthenticatedAppShell>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";

import { saveTournamentPredictionAction } from "@/app/actions/tournament-predictions";
import { AuthenticatedAppShell } from "@/components/layout/authenticated-app-shell";
import { ProdeBadge } from "@/components/prode/prode-badge";
import { InteractiveKnockoutBracket } from "@/components/tournament/interactive-knockout-bracket";
import { ensureCurrentProfile } from "@/lib/supabase/profile-bootstrap";
import { getActiveUpcomingMatchesWithDetails } from "@/lib/supabase/queries/matches";
import { getPredictionsForMatches } from "@/lib/supabase/queries/predictions";
import { getOrJoinDefaultPool } from "@/lib/supabase/queries/pools";
import {
  getCurrentTournamentPrediction,
  getTournamentLockState,
} from "@/lib/supabase/queries/tournament-predictions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  deriveActualTournamentOutcome,
  type ActualTournamentMatch,
  type ActualTournamentOutcomeResult,
} from "@/lib/tournament/actual-outcomes";
import {
  buildTournamentProjection,
  isGroupStageMatch,
} from "@/lib/tournament/projection";
import {
  getProjectedBracketFromSavedTournamentPrediction,
  getSelectionsFromSavedTournamentPrediction,
} from "@/lib/tournament/tournament-prediction-payload";
import type { ProjectedBracket } from "@/lib/tournament/types";

type ProjectedBracketSectionProps = {
  bonusActualOutcomeResult: ActualTournamentOutcomeResult;
  bracket: ProjectedBracket;
  initialSaveState: "locked" | "saved" | "unsaved";
  initialSelections: Record<string, string>;
  isLocked: boolean;
  lockedAt: string | null;
  savedAt: string | null;
};

function ProjectedBracketSection({
  bonusActualOutcomeResult,
  bracket,
  initialSaveState,
  initialSelections,
  isLocked,
  lockedAt,
  savedAt,
}: ProjectedBracketSectionProps) {
  return (
    <section className="space-y-6">
      <div className="border-y-[3px] border-prode-black bg-prode-yellow px-4 py-3 shadow-[6px_6px_0_var(--prode-black)]">
        <h2 className="font-display text-5xl uppercase leading-none">
          Llave bonus proyectada
        </h2>
      </div>

      <div className="prode-frame prode-hard-shadow bg-prode-surface p-4">
        <p className="max-w-4xl font-body text-sm leading-6 text-muted-foreground">
          Se arma con las tablas de Mis grupos como base inicial. Elegí los
          ganadores de la llave proyectada para sumar bonus si acertás las
          instancias finales.
        </p>
      </div>

      {bracket.status !== "complete" && (
        <div className="prode-frame prode-hard-shadow bg-prode-yellow p-5">
          <h3 className="font-display text-4xl uppercase leading-none">
            La llave se completa cuando haya suficientes clasificados
            proyectados.
          </h3>
          <p className="mt-3 max-w-2xl font-body text-base">
            Completaste {bracket.completedGroups}/{bracket.requiredGroups} grupos.
            Seguí cargando pronósticos para proyectar los 32 clasificados.
          </p>
        </div>
      )}

      <InteractiveKnockoutBracket
        key={bracket.roundOf32
          .map((matchup) => `${matchup.id}:${matchup.home.team.id}:${matchup.away.team.id}`)
          .join("|")}
        bracket={bracket}
        bonusActualOutcomeResult={bonusActualOutcomeResult}
        initialSaveState={initialSaveState}
        initialSelections={initialSelections}
        isLocked={isLocked}
        lockedAt={lockedAt}
        saveAction={saveTournamentPredictionAction}
        savedAt={savedAt}
      />
    </section>
  );
}

async function getActualTournamentOutcomeForBonus(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
) {
  const { data, error } = await supabase
    .from("matches")
    .select(
      "away_score,away_team_id,football_data_id,home_score,home_team_id,id,kickoff_at,match_number,stage,status,winner",
    )
    .not("stage", "is", null)
    .neq("stage", "GROUP_STAGE")
    .order("kickoff_at", { ascending: true })
    .order("football_data_id", { ascending: true });

  if (error) {
    throw error;
  }

  return deriveActualTournamentOutcome((data ?? []) as ActualTournamentMatch[]);
}

export default async function MyWorldCupPage() {
  const supabase = await createSupabaseServerClient();
  const current = await ensureCurrentProfile(supabase);

  if (!current) {
    redirect("/login");
  }

  const pool = await getOrJoinDefaultPool(supabase);
  const [savedTournamentPrediction, tournamentLockState, bonusActualOutcomeResult] =
    await Promise.all([
      getCurrentTournamentPrediction(supabase, pool.id),
      getTournamentLockState(supabase),
      getActualTournamentOutcomeForBonus(supabase),
    ]);
  const { matches } = await getActiveUpcomingMatchesWithDetails(supabase);
  const groupMatches = matches.filter(isGroupStageMatch);
  const predictionsByMatchId = await getPredictionsForMatches(
    supabase,
    pool.id,
    groupMatches.map((match) => match.id),
  );
  const { projectedBracket } = buildTournamentProjection(
    matches,
    predictionsByMatchId,
  );
  const savedProjectedBracket = getProjectedBracketFromSavedTournamentPrediction(
    savedTournamentPrediction?.bracket_json,
  );
  const isTournamentLocked = tournamentLockState.isLocked;
  const bracket = isTournamentLocked ? savedProjectedBracket : projectedBracket;
  const lockedAt =
    tournamentLockState.lockAt ?? savedTournamentPrediction?.locked_at ?? null;
  const initialSelections = getSelectionsFromSavedTournamentPrediction(
    savedTournamentPrediction?.bracket_json,
  );
  const initialSaveState = isTournamentLocked
    ? "locked"
    : savedTournamentPrediction
      ? "saved"
      : "unsaved";

  return (
    <AuthenticatedAppShell className="max-w-[92rem] gap-8">
      <section className="prode-frame prode-hard-shadow bg-prode-surface p-5 sm:p-6">
        <ProdeBadge variant="primary">Simulador bonus</ProdeBadge>
        <h1 className="mt-4 font-display text-6xl uppercase leading-[0.9] sm:text-7xl lg:text-8xl">
          Mi Mundial
        </h1>
        <p className="mt-4 max-w-3xl font-body text-base leading-7 text-muted-foreground">
          Se arma con las tablas de Mis grupos como base inicial. Elegí los
          ganadores de la llave proyectada para sumar bonus si acertás las
          instancias finales.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            className="prode-frame prode-hard-shadow prode-pressable inline-flex min-h-12 items-center justify-center bg-prode-yellow px-4 py-3 font-technical text-xs font-black uppercase"
            href="/predicciones/grupos"
          >
            Ver Mis grupos
          </Link>
          <Link
            className="prode-frame prode-pressable inline-flex min-h-12 items-center justify-center bg-prode-surface px-4 py-3 font-technical text-xs font-black uppercase"
            href="/predicciones"
          >
            Cargar predicciones
          </Link>
        </div>
      </section>

      {isTournamentLocked && !savedProjectedBracket ? (
        <section className="prode-frame prode-hard-shadow bg-prode-yellow p-5">
          <h2 className="font-display text-5xl uppercase leading-none">
            No guardaste Mi Mundial antes del cierre.
          </h2>
          <p className="mt-3 max-w-2xl font-body text-base leading-7">
            El torneo ya empezó y la llave bonus quedó bloqueada.
          </p>
        </section>
      ) : bracket ? (
        <ProjectedBracketSection
          bonusActualOutcomeResult={bonusActualOutcomeResult}
          bracket={bracket}
          initialSaveState={initialSaveState}
          initialSelections={initialSelections}
          isLocked={isTournamentLocked}
          lockedAt={lockedAt}
          savedAt={savedTournamentPrediction?.updated_at ?? null}
        />
      ) : null}
    </AuthenticatedAppShell>
  );
}

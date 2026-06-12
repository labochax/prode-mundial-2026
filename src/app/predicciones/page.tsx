import { redirect } from "next/navigation";

import {
  savePredictionAction,
  savePredictionsBatchAction,
} from "@/app/actions/predictions";
import { DashboardFixtureList } from "@/components/dashboard/dashboard-fixture-list";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { PredictionSectionTabs } from "@/components/dashboard/prediction-section-tabs";
import { AuthenticatedAppShell } from "@/components/layout/authenticated-app-shell";
import { getDashboardStageDisplay } from "@/lib/matches/dashboard-stage";
import { mapSupabaseMatchToPredictionMatch } from "@/lib/matches/prediction-match";
import { ensureCurrentProfile } from "@/lib/supabase/profile-bootstrap";
import { getActiveUpcomingMatchesWithDetails } from "@/lib/supabase/queries/matches";
import {
  getMatchPredictionStatsByMatchIds,
  getPredictionsForMatches,
} from "@/lib/supabase/queries/predictions";
import { getOrJoinDefaultPool } from "@/lib/supabase/queries/pools";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function PredictionsPage() {
  const supabase = await createSupabaseServerClient();
  const current = await ensureCurrentProfile(supabase);

  if (!current) {
    redirect("/login");
  }

  const pool = await getOrJoinDefaultPool(supabase);
  const { matches, source } = await getActiveUpcomingMatchesWithDetails(supabase);
  const [predictionsByMatchId, predictionStatsByMatchId] = await Promise.all([
    getPredictionsForMatches(
      supabase,
      pool.id,
      matches.map((match) => match.id),
    ),
    getMatchPredictionStatsByMatchIds(supabase, {
      matches: matches.map((match) => ({
        id: match.id,
        lockAt: match.lock_at,
        status: match.status,
      })),
      poolId: pool.id,
    }),
  ]);
  const predictionMatches = matches.map((match) => ({
    groupCode: match.group_code,
    match: mapSupabaseMatchToPredictionMatch(
      match,
      predictionsByMatchId.get(match.id) ?? null,
    ),
    predictionStats: predictionStatsByMatchId.get(match.id)!,
    stage: getDashboardStageDisplay(match),
  }));

  return (
    <AuthenticatedAppShell
      className="max-w-[90rem] gap-8"
      header={<DashboardHeader source={source} />}
    >
      <PredictionSectionTabs active="matches" />
      {predictionMatches.length > 0 ? (
        <DashboardFixtureList
          items={predictionMatches}
          saveBatchAction={savePredictionsBatchAction}
          saveAction={savePredictionAction}
        />
      ) : (
        <section className="prode-frame prode-hard-shadow bg-prode-surface p-6">
          <h2 className="font-display text-4xl uppercase">Sin partidos cargados</h2>
        </section>
      )}
    </AuthenticatedAppShell>
  );
}

import { redirect } from "next/navigation";

import { savePredictionAction } from "@/app/actions/predictions";
import { DashboardFixtureList } from "@/components/dashboard/dashboard-fixture-list";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { AuthenticatedAppShell } from "@/components/layout/authenticated-app-shell";
import { getDashboardStageDisplay } from "@/lib/matches/dashboard-stage";
import { mapSupabaseMatchToPredictionMatch } from "@/lib/matches/prediction-match";
import { ensureCurrentProfile } from "@/lib/supabase/profile-bootstrap";
import { getActiveUpcomingMatchesWithDetails } from "@/lib/supabase/queries/matches";
import { getPredictionsForMatches } from "@/lib/supabase/queries/predictions";
import { getOrJoinDefaultPool } from "@/lib/supabase/queries/pools";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const current = await ensureCurrentProfile(supabase);

  if (!current) {
    redirect("/login");
  }

  const pool = await getOrJoinDefaultPool(supabase);
  const { matches, source } = await getActiveUpcomingMatchesWithDetails(supabase);
  const predictionsByMatchId = await getPredictionsForMatches(
    supabase,
    pool.id,
    matches.map((match) => match.id),
  );
  const predictionMatches = matches.map((match) => ({
    groupCode: match.group_code,
    match: mapSupabaseMatchToPredictionMatch(
      match,
      predictionsByMatchId.get(match.id) ?? null,
    ),
    stage: getDashboardStageDisplay(match),
  }));

  return (
    <AuthenticatedAppShell
      className="max-w-[90rem] gap-10"
      header={<DashboardHeader source={source} />}
    >
      {predictionMatches.length > 0 ? (
        <DashboardFixtureList
          items={predictionMatches}
          saveAction={savePredictionAction}
        />
      ) : (
        <section className="prode-frame prode-hard-shadow bg-prode-surface p-6 text-prode-black">
          <h2 className="font-display text-4xl uppercase">
            Sin partidos cargados
          </h2>
          <p className="mt-3 max-w-2xl font-body text-base">
            Todavía no hay partidos disponibles en la base local. Ejecutá la
            semilla de desarrollo o la sincronización oficial antes de probar el
            flujo de pronósticos.
          </p>
        </section>
      )}
    </AuthenticatedAppShell>
  );
}

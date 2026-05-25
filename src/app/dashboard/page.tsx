import { ArrowDown } from "lucide-react";
import { redirect } from "next/navigation";

import { savePredictionAction } from "@/app/actions/predictions";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { MatchPredictionCard } from "@/components/dashboard/match-prediction-card";
import { AuthenticatedAppShell } from "@/components/layout/authenticated-app-shell";
import {
  getDashboardStageDisplay,
  groupDashboardStageItems,
} from "@/lib/matches/dashboard-stage";
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
    match: mapSupabaseMatchToPredictionMatch(
      match,
      predictionsByMatchId.get(match.id) ?? null,
    ),
    stage: getDashboardStageDisplay(match),
  }));
  const stageSections = groupDashboardStageItems(predictionMatches);

  return (
    <AuthenticatedAppShell
      className="max-w-[90rem] gap-10"
      header={<DashboardHeader source={source} />}
    >
      {stageSections.length > 0 ? (
        <div
          aria-label="Partidos disponibles para cargar pronóstico"
          className="space-y-10"
        >
          {stageSections.map((section) => (
            <section
              aria-labelledby={`dashboard-section-${section.key}`}
              className="space-y-6"
              key={section.key}
            >
              <div className="border-y-[3px] border-prode-black bg-prode-yellow px-4 py-3 shadow-[6px_6px_0_var(--prode-black)] sm:px-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h2
                    className="font-display text-4xl uppercase leading-none text-prode-black sm:text-5xl"
                    id={`dashboard-section-${section.key}`}
                  >
                    {section.heading}
                  </h2>
                  <span className="font-technical text-xs font-black uppercase text-prode-black">
                    {section.items.length} partidos
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                {section.items.map(({ match, stage }) => (
                  <MatchPredictionCard
                    key={match.id}
                    match={match}
                    saveAction={savePredictionAction}
                    stageHeading={stage.heading}
                    stageMarker={stage.marker}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
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

      <button
        className="prode-pressable flex w-full items-center justify-center gap-4 border-y-[3px] border-prode-black bg-transparent py-4 font-display text-2xl uppercase outline-none hover:bg-[#f7f4df] focus-visible:ring-[3px] focus-visible:ring-prode-black focus-visible:ring-offset-[3px] focus-visible:ring-offset-prode-paper"
        type="button"
      >
        <ArrowDown aria-hidden="true" className="size-6 stroke-[3]" />
        Cargar más partidos
        <ArrowDown aria-hidden="true" className="size-6 stroke-[3]" />
      </button>
    </AuthenticatedAppShell>
  );
}

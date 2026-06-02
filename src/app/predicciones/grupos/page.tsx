import { redirect } from "next/navigation";

import { PredictionSectionTabs } from "@/components/dashboard/prediction-section-tabs";
import { AuthenticatedAppShell } from "@/components/layout/authenticated-app-shell";
import { ProdeBadge } from "@/components/prode/prode-badge";
import { GroupProjectionView } from "@/components/tournament/group-projection-view";
import { ensureCurrentProfile } from "@/lib/supabase/profile-bootstrap";
import { getActiveUpcomingMatchesWithDetails } from "@/lib/supabase/queries/matches";
import { getPredictionsForMatches } from "@/lib/supabase/queries/predictions";
import { getOrJoinDefaultPool } from "@/lib/supabase/queries/pools";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  buildTournamentProjection,
  isGroupStageMatch,
} from "@/lib/tournament/projection";

export default async function PredictionGroupsPage() {
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
  const { groups, thirdPlacedTeams } = buildTournamentProjection(
    matches,
    predictionsByMatchId,
  );
  const completedPredictions = groups.reduce(
    (total, group) => total + group.predictionsCompleted,
    0,
  );

  return (
    <AuthenticatedAppShell className="max-w-[92rem] gap-8">
      <section className="prode-frame prode-hard-shadow bg-prode-surface p-5 sm:p-6">
        <ProdeBadge variant="primary">Proyección dinámica</ProdeBadge>
        <h1 className="mt-4 font-display text-6xl uppercase leading-[0.9] sm:text-7xl">
          Mis grupos
        </h1>
        <p className="mt-4 max-w-3xl font-body text-base leading-7 text-muted-foreground">
          Estas tablas se calculan automáticamente con tus predicciones por
          goles de la fase de grupos. Si cambiás un resultado en Predicciones,
          se actualizan.
        </p>
      </section>

      <PredictionSectionTabs active="groups" />

      {completedPredictions > 0 ? (
        <GroupProjectionView groups={groups} thirdPlacedTeams={thirdPlacedTeams} />
      ) : (
        <section className="prode-frame prode-hard-shadow bg-prode-yellow p-5">
          <h2 className="font-display text-4xl uppercase leading-none">
            Cargá pronósticos en Predicciones para armar tus grupos.
          </h2>
        </section>
      )}
    </AuthenticatedAppShell>
  );
}

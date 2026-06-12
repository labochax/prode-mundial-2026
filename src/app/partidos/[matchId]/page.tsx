import Link from "next/link";
import { redirect } from "next/navigation";

import { savePredictionAction } from "@/app/actions/predictions";
import { AuthenticatedAppShell } from "@/components/layout/authenticated-app-shell";
import { MatchDetailToolbar } from "@/components/match-detail/match-detail-toolbar";
import { MatchStatsPanel } from "@/components/match-detail/match-stats-panel";
import { PredictionCanvas } from "@/components/match-detail/prediction-canvas";
import { ProdeBadge } from "@/components/prode/prode-badge";
import { mapSupabaseMatchToPredictionMatch } from "@/lib/matches/prediction-match";
import { ensureCurrentProfile } from "@/lib/supabase/profile-bootstrap";
import {
  getMatchWithDetailsById,
  getNextActiveMatchAfter,
} from "@/lib/supabase/queries/matches";
import {
  getMatchPredictionStats,
  getPredictionForMatch,
} from "@/lib/supabase/queries/predictions";
import { getOrJoinDefaultPool } from "@/lib/supabase/queries/pools";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type MatchPageProps = {
  params: Promise<{ matchId: string }>;
};

export default async function MatchPage({ params }: MatchPageProps) {
  const { matchId } = await params;
  const supabase = await createSupabaseServerClient();
  const current = await ensureCurrentProfile(supabase);

  if (!current) {
    redirect("/login");
  }

  const pool = await getOrJoinDefaultPool(supabase);
  const matchRow = await getMatchWithDetailsById(supabase, matchId);

  if (!matchRow) {
    return (
      <AuthenticatedAppShell
        className="max-w-[90rem]"
        title="Partido no encontrado"
        description="No encontramos ese partido en la base local de Supabase."
        eyebrow={`Partido ${matchId}`}
      >
        <section className="prode-frame prode-hard-shadow max-w-3xl bg-prode-surface p-6 sm:p-8">
          <ProdeBadge variant="surface">Sin datos locales</ProdeBadge>
          <h1 className="mt-4 font-display text-5xl uppercase leading-none">
            No encontramos ese partido
          </h1>
          <Link
            className="prode-frame prode-hard-shadow prode-pressable mt-6 inline-flex min-h-12 items-center justify-center bg-prode-yellow px-4 py-3 font-technical text-sm font-bold uppercase text-prode-black outline-none focus-visible:ring-[3px] focus-visible:ring-prode-black focus-visible:ring-offset-[3px] focus-visible:ring-offset-prode-paper"
            href="/predicciones"
          >
            Volver al panel
          </Link>
        </section>
      </AuthenticatedAppShell>
    );
  }

  const [prediction, nextMatchRow, predictionStats] = await Promise.all([
    getPredictionForMatch(supabase, matchRow.id, pool.id),
    getNextActiveMatchAfter(supabase, matchRow),
    getMatchPredictionStats(supabase, {
      lockAt: matchRow.lock_at,
      matchId: matchRow.id,
      poolId: pool.id,
      status: matchRow.status,
    }),
  ]);
  const match = mapSupabaseMatchToPredictionMatch(matchRow, prediction);
  const nextMatch = nextMatchRow
    ? mapSupabaseMatchToPredictionMatch(nextMatchRow, null)
    : null;

  return (
    <AuthenticatedAppShell
      className="max-w-[90rem] gap-8"
      header={<MatchDetailToolbar match={match} />}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <PredictionCanvas
            match={match}
            nextMatchHref={
              nextMatch ? `/partidos/${nextMatch.id}` : "/predicciones"
            }
            nextMatchLabel={
              nextMatch ? "Siguiente partido" : "Volver al panel"
            }
            saveAction={savePredictionAction}
          />
        </div>

        <div className="lg:col-span-4">
          <MatchStatsPanel match={match} stats={predictionStats} />
        </div>
      </div>
    </AuthenticatedAppShell>
  );
}

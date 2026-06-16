import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";

import { AuthenticatedAppShell } from "@/components/layout/authenticated-app-shell";
import { PlayerMiMundialEmptyState } from "@/components/tournament/player-mi-mundial-empty-state";
import { PlayerVisiblePredictionsSection } from "@/components/tournament/player-visible-predictions-section";
import { ReadOnlyTournamentBracket } from "@/components/tournament/read-only-tournament-bracket";
import { ensureCurrentProfile } from "@/lib/supabase/profile-bootstrap";
import { getPoolLeaderboard } from "@/lib/supabase/queries/leaderboard";
import { getPlayerVisiblePredictions } from "@/lib/supabase/queries/player-visible-predictions";
import {
  getOrJoinDefaultPool,
  getPoolMembershipForUser,
} from "@/lib/supabase/queries/pools";
import { getProfileById } from "@/lib/supabase/queries/profiles";
import {
  getTournamentLockAt,
  getVisibleTournamentPredictionForUser,
} from "@/lib/supabase/queries/tournament-predictions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getReadOnlyTournamentPredictionFromSavedJson } from "@/lib/tournament/tournament-prediction-payload";
import { isTournamentPredictionPublicByTime } from "@/lib/tournament/tournament-prediction-visibility";

type PlayerMiMundialPageProps = {
  params: Promise<{ userId: string }>;
};

const userIdSchema = z.string().uuid();

function getDisplayName(profile: Awaited<ReturnType<typeof getProfileById>>) {
  if (!profile) {
    return "Jugador";
  }

  return (
    profile.display_name ||
    profile.full_name ||
    profile.email?.split("@")[0] ||
    "Jugador"
  );
}

function MiMundialStatusCard({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <section className="prode-frame prode-hard-shadow bg-prode-surface p-5 sm:p-6">
      <span className="prode-frame bg-prode-yellow px-3 py-2 font-technical text-xs font-black uppercase">
        Mi Mundial
      </span>
      <h2 className="mt-4 font-display text-5xl uppercase leading-none">
        {title}
      </h2>
      <p className="mt-4 max-w-2xl font-body text-base leading-7 text-muted-foreground">
        {description}
      </p>
    </section>
  );
}

export default async function PlayerMiMundialPage({
  params,
}: PlayerMiMundialPageProps) {
  const { userId } = await params;
  const supabase = await createSupabaseServerClient();
  const current = await ensureCurrentProfile(supabase);

  if (!current) {
    redirect("/login");
  }

  if (!userIdSchema.safeParse(userId).success) {
    return (
      <AuthenticatedAppShell className="max-w-[92rem]">
        <PlayerMiMundialEmptyState
          description="No encontramos ese jugador en este Prode."
          title="Jugador no encontrado"
        />
      </AuthenticatedAppShell>
    );
  }

  const pool = await getOrJoinDefaultPool(supabase);
  const [membership, profile, prediction, leaderboard, lockAt, visiblePredictions] =
    await Promise.all([
      getPoolMembershipForUser(supabase, pool.id, userId),
      getProfileById(supabase, userId),
      getVisibleTournamentPredictionForUser(supabase, pool.id, userId),
      getPoolLeaderboard(supabase, pool.id),
      getTournamentLockAt(supabase),
      getPlayerVisiblePredictions(supabase, pool.id, userId),
    ]);

  if (!membership || !profile) {
    return (
      <AuthenticatedAppShell className="max-w-[92rem]">
        <PlayerMiMundialEmptyState
          description="No encontramos ese jugador en este Prode."
          title="Jugador no encontrado"
        />
      </AuthenticatedAppShell>
    );
  }

  const displayName = getDisplayName(profile);
  const standing = leaderboard.find((row) => row.user_id === userId);
  const canReadOtherPredictions =
    userId === current.user.id ||
    isTournamentPredictionPublicByTime(lockAt);
  const readOnlyPrediction = prediction
    ? getReadOnlyTournamentPredictionFromSavedJson(prediction.bracket_json)
    : null;
  const miMundialStatusDescription = prediction
    ? "No pudimos reconstruir el Mi Mundial de este jugador."
    : canReadOtherPredictions
      ? "Este jugador no guardó Mi Mundial."
      : "Mi Mundial todavía no está disponible para ver.";

  return (
    <AuthenticatedAppShell className="max-w-[92rem] gap-8">
      <section className="prode-frame prode-hard-shadow bg-prode-surface p-5 sm:p-6">
        <span className="prode-frame bg-prode-yellow px-3 py-2 font-technical text-xs font-black uppercase">
          Jugador
        </span>
        <h1 className="mt-4 font-display text-6xl uppercase leading-[0.9] sm:text-7xl">
          {displayName}
        </h1>
        <p className="mt-4 font-technical text-xs font-black uppercase text-muted-foreground">
          {standing
            ? `Puesto #${standing.rank} · ${standing.total_points} puntos`
            : "Resumen privado del Prode"}
        </p>
        <Link
          className="prode-frame prode-hard-shadow prode-pressable mt-5 inline-flex min-h-12 items-center justify-center bg-prode-yellow px-4 py-3 font-technical text-xs font-black uppercase"
          href="/posiciones"
        >
          Volver a posiciones
        </Link>
      </section>

      {prediction && readOnlyPrediction ? (
        <ReadOnlyTournamentBracket
          bonusPoints={prediction.bonus_points}
          rounds={readOnlyPrediction.rounds}
          selections={readOnlyPrediction.selections}
        />
      ) : (
        <MiMundialStatusCard
          description={miMundialStatusDescription}
          title="Mi Mundial"
        />
      )}

      <PlayerVisiblePredictionsSection predictions={visiblePredictions} />
    </AuthenticatedAppShell>
  );
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureCurrentProfile } from "@/lib/supabase/profile-bootstrap";
import { getOrJoinDefaultPool } from "@/lib/supabase/queries/pools";
import { getCurrentTournamentPrediction } from "@/lib/supabase/queries/tournament-predictions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  deriveActualTournamentOutcome,
  type ActualTournamentMatch,
} from "@/lib/tournament/actual-outcomes";
import { scoreTournamentPredictionBonus } from "@/lib/tournament/bonus-scoring";
import {
  buildDevWorldCupKnockoutDatabaseUpdates,
  buildDevWorldCupMatchUpdatesFromSavedBracket,
  buildDevWorldCupResetMatchUpdates,
  getDevWorldCupResetSuccessMessage,
  getTournamentPredictionBonusResetPatch,
  type DevWorldCupMatchUpdate,
  type DevWorldCupResetMatch,
} from "@/lib/tournament/dev-world-cup-simulator";

type TournamentPredictionForScoring = {
  champion_team_id: string;
  fourth_place_team_id: string;
  id: string;
  quarterfinal_team_ids: string[];
  round_of_16_team_ids: string[];
  runner_up_team_id: string;
  semifinal_team_ids: string[];
  third_place_team_id: string;
};

type DevGroupMatchForSimulation = {
  away_team_id: string | null;
  home_team_id: string | null;
  id: string;
  match_number: number | null;
};

type DevKnockoutMatchForSimulation = {
  football_data_id: number | null;
  id: string;
  kickoff_at: string;
  match_number: number | null;
  stage: string | null;
};

function redirectWithParams(params: Record<string, string>): never {
  const searchParams = new URLSearchParams(params);

  redirect(`/admin/sync?${searchParams.toString()}`);
}

function isDevelopmentRuntime() {
  return process.env.NODE_ENV !== "production";
}

function getErrorDetails(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return {};
  }

  return {
    code:
      "code" in error && typeof error.code === "string" ? error.code : null,
    details:
      "details" in error && typeof error.details === "string"
        ? error.details
        : null,
    hint:
      "hint" in error && typeof error.hint === "string" ? error.hint : null,
    message:
      "message" in error && typeof error.message === "string"
        ? error.message
        : null,
  };
}

function mapPredictionForScoring(prediction: TournamentPredictionForScoring) {
  return {
    championTeamId: prediction.champion_team_id,
    fourthPlaceTeamId: prediction.fourth_place_team_id,
    quarterfinalTeamIds: prediction.quarterfinal_team_ids,
    roundOf16TeamIds: prediction.round_of_16_team_ids,
    runnerUpTeamId: prediction.runner_up_team_id,
    semifinalTeamIds: prediction.semifinal_team_ids,
    thirdPlaceTeamId: prediction.third_place_team_id,
  };
}

function buildDevGroupResult(matchNumber: number) {
  const variant = matchNumber % 3;

  if (variant === 0) {
    return {
      away_score: 1,
      home_score: 1,
      winner: "DRAW" as const,
    };
  }

  if (variant === 1) {
    return {
      away_score: 0,
      home_score: 2,
      winner: "HOME_TEAM" as const,
    };
  }

  return {
    away_score: 2,
    home_score: 0,
    winner: "AWAY_TEAM" as const,
  };
}

async function updateGroupMatchesForDevSimulation(
  admin: ReturnType<typeof createSupabaseAdminClient>,
) {
  const { data: matches, error } = await admin
    .from("matches")
    .select("id,match_number,home_team_id,away_team_id")
    .not("match_number", "is", null)
    .gte("match_number", 1)
    .lte("match_number", 72)
    .not("home_team_id", "is", null)
    .not("away_team_id", "is", null);

  if (error) {
    throw error;
  }

  let updatedCount = 0;

  for (const match of (matches ?? []) as DevGroupMatchForSimulation[]) {
    if (typeof match.match_number !== "number") {
      continue;
    }

    const result = buildDevGroupResult(match.match_number);
    const { error: updateError } = await admin
      .from("matches")
      .update({
        away_score: result.away_score,
        home_score: result.home_score,
        minute: null,
        status: "FINISHED",
        winner: result.winner,
      })
      .eq("id", match.id);

    if (updateError) {
      throw updateError;
    }

    updatedCount += 1;
  }

  return updatedCount;
}

async function updateKnockoutMatchesForDevSimulation(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  updates: DevWorldCupMatchUpdate[],
) {
  const { data: targets, error: targetsError } = await admin
    .from("matches")
    .select("id,stage,kickoff_at,football_data_id,match_number")
    .not("stage", "is", null)
    .neq("stage", "GROUP_STAGE")
    .order("kickoff_at", { ascending: true })
    .order("football_data_id", { ascending: true });

  if (targetsError) {
    throw targetsError;
  }

  const databaseUpdates = buildDevWorldCupKnockoutDatabaseUpdates(
    updates,
    ((targets ?? []) as DevKnockoutMatchForSimulation[]).map((target) => ({
      footballDataId: target.football_data_id,
      id: target.id,
      kickoffAt: target.kickoff_at,
      matchNumber: target.match_number,
      stage: target.stage,
    })),
  );

  if (databaseUpdates.status === "error") {
    throw new Error(databaseUpdates.message);
  }

  let updatedCount = 0;

  for (const update of databaseUpdates.updates) {
    const { data, error } = await admin
      .from("matches")
      .update({
        away_score: update.awayScore,
        away_team_id: update.awayTeamId,
        home_score: update.homeScore,
        home_team_id: update.homeTeamId,
        match_number: update.matchNumber,
        minute: null,
        status: "FINISHED",
        winner: update.winner,
      })
      .eq("id", update.id)
      .select("id")
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data) {
      updatedCount += 1;
    }
  }

  return updatedCount;
}

export async function autocompleteDevWorldCupResultsAction() {
  if (!isDevelopmentRuntime()) {
    redirectWithParams({
      mundial_dev_error: "Esta herramienta está desactivada en producción.",
    });
  }

  let redirectParams: Record<string, string>;

  try {
    const supabase = await createSupabaseServerClient();
    const current = await ensureCurrentProfile(supabase);

    if (!current) {
      redirectParams = {
        mundial_dev_error: "Iniciá sesión para usar el simulador dev.",
      };
    } else {
      const pool = await getOrJoinDefaultPool(supabase);
      const savedPrediction = await getCurrentTournamentPrediction(
        supabase,
        pool.id,
      );

      if (!savedPrediction) {
        redirectParams = {
          mundial_dev_error:
            "Guardá Mi Mundial antes de autocompletar resultados de prueba.",
        };
      } else {
        const simulation = buildDevWorldCupMatchUpdatesFromSavedBracket(
          savedPrediction.bracket_json,
        );

        if (simulation.status === "error") {
          redirectParams = {
            mundial_dev_error: simulation.message,
          };
        } else {
          const admin = createSupabaseAdminClient();
          const groupMatchesUpdated =
            await updateGroupMatchesForDevSimulation(admin);
          const knockoutMatchesUpdated =
            await updateKnockoutMatchesForDevSimulation(
              admin,
              simulation.updates,
            );

          revalidatePath("/admin/sync");
          revalidatePath("/dashboard");
          revalidatePath("/mi-mundial");
          revalidatePath("/posiciones");

          redirectParams = {
            mundial_dev_estado: "autocompletado",
            mundial_dev_group: String(groupMatchesUpdated),
            mundial_dev_knockout: String(knockoutMatchesUpdated),
            mundial_dev_matches: String(
              groupMatchesUpdated + knockoutMatchesUpdated,
            ),
          };
        }
      }
    }
  } catch (error) {
    if (isDevelopmentRuntime()) {
      console.error("[autocompleteDevWorldCupResultsAction]", {
        ...getErrorDetails(error),
      });
    }

    redirectParams = {
      mundial_dev_error:
        "No pudimos autocompletar el Mundial de prueba.",
    };
  }

  redirectWithParams(redirectParams);
}

export async function resetDevWorldCupResultsAction() {
  if (!isDevelopmentRuntime()) {
    redirectWithParams({
      mundial_dev_reset_error:
        "Esta herramienta está desactivada en producción.",
    });
  }

  let redirectParams: Record<string, string>;

  try {
    const admin = createSupabaseAdminClient();
    const { data: matches, error: matchesError } = await admin
      .from("matches")
      .select("id,match_number,stage,home_team_id,away_team_id");

    if (matchesError) {
      throw matchesError;
    }

    const matchUpdates = buildDevWorldCupResetMatchUpdates(
      (matches ?? []) as DevWorldCupResetMatch[],
    );
    let matchesReset = 0;

    for (const update of matchUpdates) {
      const { id, ...patch } = update;
      const { data, error } = await admin
        .from("matches")
        .update(patch)
        .eq("id", id)
        .select("id")
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        matchesReset += 1;
      }
    }

    const { data: predictions, error: predictionsError } = await admin
      .from("predictions")
      .select("id");

    if (predictionsError) {
      throw predictionsError;
    }

    for (const prediction of predictions ?? []) {
      const { error } = await admin
        .from("predictions")
        .update({
          points: null,
          scored_at: null,
        })
        .eq("id", prediction.id);

      if (error) {
        throw error;
      }
    }

    const { data: tournamentPredictions, error: tournamentPredictionsError } =
      await admin.from("tournament_predictions").select("id");

    if (tournamentPredictionsError) {
      throw tournamentPredictionsError;
    }

    const bonusPatch = getTournamentPredictionBonusResetPatch();

    for (const tournamentPrediction of tournamentPredictions ?? []) {
      const { error } = await admin
        .from("tournament_predictions")
        .update(bonusPatch)
        .eq("id", tournamentPrediction.id);

      if (error) {
        throw error;
      }
    }

    revalidatePath("/admin/sync");
    revalidatePath("/dashboard");
    revalidatePath("/mi-mundial");
    revalidatePath("/posiciones");

    redirectParams = {
      mundial_dev_reset_bonus: String(tournamentPredictions?.length ?? 0),
      mundial_dev_reset_estado: "reiniciado",
      mundial_dev_reset_matches: String(matchesReset),
      mundial_dev_reset_predictions: String(predictions?.length ?? 0),
      mundial_dev_reset_text: getDevWorldCupResetSuccessMessage({
        bonusReset: tournamentPredictions?.length ?? 0,
        matchesReset,
        predictionsConserved: predictions?.length ?? 0,
      }),
    };
  } catch (error) {
    if (isDevelopmentRuntime()) {
      console.error("[resetDevWorldCupResultsAction]", {
        ...getErrorDetails(error),
      });
    }

    redirectParams = {
      mundial_dev_reset_error:
        "No pudimos eliminar los datos del Mundial de prueba.",
    };
  }

  redirectWithParams(redirectParams);
}

export async function scoreTournamentPredictionsAction() {
  if (!isDevelopmentRuntime()) {
    redirectWithParams({
      mundial_error: "Esta herramienta está desactivada en producción.",
    });
  }

  let admin;

  try {
    admin = createSupabaseAdminClient();
  } catch (error) {
    if (isDevelopmentRuntime()) {
      console.error("[scoreTournamentPredictionsAction:admin-client]", error);
    }

    redirectWithParams({
      mundial_error: "No pudimos iniciar la herramienta local de Mi Mundial.",
    });
  }

  const { data: matches, error: matchesError } = await admin
    .from("matches")
    .select(
      "away_score,away_team_id,football_data_id,home_score,home_team_id,id,kickoff_at,match_number,stage,status,winner",
    )
    .not("stage", "is", null)
    .neq("stage", "GROUP_STAGE")
    .order("kickoff_at", { ascending: true })
    .order("football_data_id", { ascending: true });

  if (matchesError) {
    if (isDevelopmentRuntime()) {
      console.error("[scoreTournamentPredictionsAction:matches]", {
        ...getErrorDetails(matchesError),
      });
    }

    redirectWithParams({
      mundial_error: "No pudimos leer los resultados de eliminatorias.",
    });
  }

  const actualOutcome = deriveActualTournamentOutcome(
    (matches ?? []) as ActualTournamentMatch[],
  );

  if (actualOutcome.status === "incomplete") {
    redirectWithParams({
      mundial_checked: "0",
      mundial_estado: "incompleto",
      mundial_reason: actualOutcome.reason,
      mundial_scored: "0",
      mundial_updated: "0",
    });
  }

  const { data: predictions, error: predictionsError } = await admin
    .from("tournament_predictions")
    .select(
      "id,round_of_16_team_ids,quarterfinal_team_ids,semifinal_team_ids,champion_team_id,runner_up_team_id,third_place_team_id,fourth_place_team_id",
    );

  if (predictionsError) {
    if (isDevelopmentRuntime()) {
      console.error("[scoreTournamentPredictionsAction:predictions]", {
        ...getErrorDetails(predictionsError),
      });
    }

    redirectWithParams({
      mundial_error: "No pudimos leer las llaves guardadas.",
    });
  }

  let updatedCount = 0;
  let totalBonusPoints = 0;
  const scoredPredictions = predictions ?? [];

  for (const prediction of scoredPredictions as TournamentPredictionForScoring[]) {
    const result = scoreTournamentPredictionBonus(
      mapPredictionForScoring(prediction),
      actualOutcome.outcome,
    );
    totalBonusPoints += result.totalPoints;
    const { error: updateError } = await admin
      .from("tournament_predictions")
      .update({
        bonus_points: result.totalPoints,
        scored_at: new Date().toISOString(),
      })
      .eq("id", prediction.id);

    if (updateError) {
      if (isDevelopmentRuntime()) {
        console.error("[scoreTournamentPredictionsAction:update]", {
          predictionId: prediction.id,
          ...getErrorDetails(updateError),
        });
      }

      redirectWithParams({
        mundial_error: "Falló la actualización de bonus de Mi Mundial.",
      });
    }

    updatedCount += 1;
  }

  revalidatePath("/admin/sync");
  revalidatePath("/mi-mundial");
  revalidatePath("/posiciones");

  redirectWithParams({
    mundial_checked: String(scoredPredictions.length),
    mundial_estado: "puntuado",
    mundial_points: String(totalBonusPoints),
    mundial_scored: String(scoredPredictions.length),
    mundial_updated: String(updatedCount),
  });
}

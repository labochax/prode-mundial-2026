"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { AdminAuthorizationError } from "@/lib/admin/admin-authorization";
import { assertCurrentUserIsAdmin } from "@/lib/admin/admin-authorization.server";
import {
  AdminResultValidationError,
  finalizeAdminMatchResult,
  parseManualResultInput,
} from "@/lib/admin/results-control";
import { FootballDataApiError } from "@/lib/sports/football-data/client";
import { syncFootballDataResults } from "@/lib/sports/football-data/results-sync";
import { SportsApiConfigError } from "@/lib/sports/env.server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getAdminResultsPath(params: Record<string, string>) {
  const searchParams = new URLSearchParams(params);
  return `/admin/resultados?${searchParams.toString()}`;
}

function getSafeActionError(error: unknown) {
  if (error instanceof AdminAuthorizationError) {
    return "No autorizado.";
  }

  if (
    error instanceof AdminResultValidationError ||
    error instanceof SportsApiConfigError
  ) {
    return error.message;
  }

  if (error instanceof FootballDataApiError) {
    if (error.status === 429) {
      return "Football-Data alcanzó el límite de uso. Esperá el reinicio de cuota.";
    }

    if (error.status === 401 || error.status === 403) {
      return "Football-Data rechazó el token configurado.";
    }

    return error.message;
  }

  return "No pudimos completar la operación.";
}

function revalidateResultPaths(matchId?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/predicciones");
  revalidatePath("/predicciones/grupos");
  revalidatePath("/posiciones");
  revalidatePath("/mi-mundial");
  revalidatePath("/admin/resultados");

  if (matchId) {
    revalidatePath(`/partidos/${matchId}`);
  } else {
    revalidatePath("/partidos/[matchId]", "page");
  }
}

export async function syncResultsFromAdminAction() {
  let redirectPath: string;

  try {
    await assertCurrentUserIsAdmin();
    const result = await syncFootballDataResults({ trigger: "manual" });

    revalidateResultPaths();
    redirectPath = getAdminResultsPath({
      sync_checked: String(result.checkedMatches),
      sync_estado: "ok",
      sync_finished: String(result.finishedMatchesScored),
      sync_minute: result.requestsAvailableMinute ?? "",
      sync_scored: String(result.scoredPredictions),
      sync_stale: String(result.staleResultsSkipped),
      sync_updated: String(result.matchesUpdated),
    });
  } catch (error) {
    redirectPath = getAdminResultsPath({
      sync_error: getSafeActionError(error),
    });
  }

  redirect(redirectPath);
}

export async function finalizeMatchAndScoreAction(formData: FormData) {
  let redirectPath: string;

  try {
    await assertCurrentUserIsAdmin();
    const input = parseManualResultInput({
      away_score: getString(formData, "away_score"),
      home_score: getString(formData, "home_score"),
      match_id: getString(formData, "match_id"),
    });
    const admin = createSupabaseAdminClient();
    const { data: match, error: matchError } = await admin
      .from("matches")
      .select(
        "id, match_number, football_data_id, home_team_id, away_team_id, home_team:teams!matches_home_team_id_fkey(name_es), away_team:teams!matches_away_team_id_fkey(name_es)",
      )
      .eq("id", input.matchId)
      .not("football_data_id", "is", null)
      .maybeSingle();

    if (matchError) {
      throw matchError;
    }

    if (!match) {
      throw new AdminResultValidationError("El partido no existe.");
    }

    const result = await finalizeAdminMatchResult({
      input,
      match,
      scorePredictions: async (matchId) => {
        const { data, error } = await admin.rpc("score_match_predictions", {
          target_match_id: matchId,
        });

        if (error) {
          throw error;
        }

        return data ?? 0;
      },
      updateMatch: async (matchId, patch) => {
        const { error } = await admin
          .from("matches")
          .update(patch)
          .eq("id", matchId)
          .select("id")
          .single();

        if (error) {
          throw error;
        }
      },
    });
    const homeName = match.home_team?.name_es ?? "Local";
    const awayName = match.away_team?.name_es ?? "Visitante";

    revalidateResultPaths(input.matchId);
    redirectPath = getAdminResultsPath({
      final_away: String(result.awayScore),
      final_estado: "ok",
      final_home: String(result.homeScore),
      final_match: `${homeName} vs ${awayName}`,
      final_scored: String(result.predictionsScored),
    });
  } catch (error) {
    redirectPath = getAdminResultsPath({
      final_error: getSafeActionError(error),
    });
  }

  redirect(redirectPath);
}

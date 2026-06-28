"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { FootballDataApiError } from "@/lib/sports/football-data/client";
import { syncFootballDataResults } from "@/lib/sports/football-data/results-sync";
import { SportsApiConfigError } from "@/lib/sports/env.server";

function getResultsRedirectPath(params: Record<string, string>) {
  const searchParams = new URLSearchParams(params);

  return `/admin/sync?${searchParams.toString()}`;
}

function getResultsErrorMessage(error: unknown) {
  if (error instanceof SportsApiConfigError) {
    return error.message;
  }

  if (error instanceof FootballDataApiError) {
    if (error.status === 429) {
      return "Football-Data respondió con límite de uso. Esperá el reinicio de cuota y probá de nuevo.";
    }

    if (error.status === 401 || error.status === 403) {
      return "Football-Data rechazó el token. Revisá FOOTBALL_DATA_API_TOKEN en .env.local.";
    }

    if (error.status === 404) {
      return "Football-Data no encontró resultados para la competencia o temporada solicitada.";
    }

    return error.message;
  }

  if (
    error instanceof TypeError ||
    (error instanceof Error && error.message.toLowerCase().includes("fetch"))
  ) {
    return "No pudimos conectar con Football-Data. Revisá la red y probá de nuevo.";
  }

  if (error instanceof Error && error.message.startsWith("Falta configurar")) {
    return error.message;
  }

  return "No pudimos sincronizar los resultados.";
}

export async function syncFootballDataResultsAction() {
  const isDevelopment = process.env.NODE_ENV !== "production";

  if (!isDevelopment) {
    redirect(
      getResultsRedirectPath({
        results_error: "La sincronización de resultados está desactivada en producción.",
      }),
    );
  }

  let redirectPath: string;

  try {
    const result = await syncFootballDataResults();

    revalidatePath("/dashboard");
    revalidatePath("/predicciones");
    revalidatePath("/predicciones/grupos");
    revalidatePath("/posiciones");
    revalidatePath("/admin/sync");

    redirectPath = getResultsRedirectPath({
      results_checked: String(result.checkedMatches),
      results_estado: "ok",
      results_finished: String(result.finishedMatchesScored),
      results_adv_applied: String(result.knockoutAdvancementMappedFixturesApplied),
      results_adv_corrected: String(
        result.knockoutAdvancementMappedFixturesCorrected,
      ),
      results_adv_missing_source: String(
        result.knockoutAdvancementSkippedMissingSourceFixture,
      ),
      results_adv_missing_target: String(
        result.knockoutAdvancementSkippedMissingTargetFixture,
      ),
      results_adv_resolved: String(result.knockoutAdvancementTeamSlotsResolved),
      results_adv_unlocked: String(result.knockoutAdvancementMatchesUnlocked),
      results_adv_waiting: String(
        result.knockoutAdvancementSkippedWaitingForSourceResult,
      ),
      results_knockout_applied: String(result.knockoutMappedFixturesApplied),
      results_knockout_corrected: String(result.knockoutMappedFixturesCorrected),
      results_knockout_missing_map: String(
        result.knockoutSkippedMissingOfficialFixtureMap,
      ),
      results_knockout_missing_team: String(
        result.knockoutMappedFixturesSkippedMissingTeam,
      ),
      results_live: String(result.liveMatchesUpdated),
      results_r16_applied: String(result.roundOf16MappedFixturesApplied),
      results_r16_corrected: String(result.roundOf16MappedFixturesCorrected),
      results_r16_missing_source: String(
        result.roundOf16SkippedMissingSourceFixture,
      ),
      results_r16_missing_target: String(
        result.roundOf16SkippedMissingTargetFixtureMap,
      ),
      results_r16_resolved: String(result.roundOf16TeamSlotsResolved),
      results_r16_unlocked: String(result.roundOf16MatchesUnlocked),
      results_r16_waiting: String(result.roundOf16SkippedWaitingForSourceWinner),
      results_reset: result.rateLimitReset ?? "",
      results_run: result.syncRunId,
      results_scored: String(result.scoredPredictions),
      results_stale: String(result.staleResultsSkipped),
      results_stopped: String(result.stoppedMatchesUpdated),
      results_text:
        `Actualizados: ${result.matchesUpdated}. ` +
        `Resultados desactualizados protegidos: ${result.staleResultsSkipped}. ` +
        `16avos mapeados: ${result.knockoutMappedFixturesApplied}. ` +
        `16avos corregidos: ${result.knockoutMappedFixturesCorrected}. ` +
        `16avos sin equipo local: ${result.knockoutMappedFixturesSkippedMissingTeam}. ` +
        `16avos sin mapa oficial: ${result.knockoutSkippedMissingOfficialFixtureMap}. ` +
        `Octavos slots resueltos: ${result.roundOf16TeamSlotsResolved}. ` +
        `Octavos desbloqueados: ${result.roundOf16MatchesUnlocked}. ` +
        `Avances M89-M104 slots resueltos: ${result.knockoutAdvancementTeamSlotsResolved}. ` +
        `Avances M89-M104 desbloqueados: ${result.knockoutAdvancementMatchesUnlocked}. ` +
        "Predicciones directas modificadas: 0.",
    });
  } catch (error) {
    if (isDevelopment) {
      console.error("[syncFootballDataResultsAction]", {
        message: error instanceof Error ? error.message : "unknown",
        name: error instanceof Error ? error.name : "unknown",
      });
    }

    redirectPath = getResultsRedirectPath({
      results_error: getResultsErrorMessage(error),
    });
  }

  redirect(redirectPath);
}

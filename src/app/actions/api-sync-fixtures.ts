"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { FootballDataApiError } from "@/lib/sports/football-data/client";
import { syncFootballDataFixtures } from "@/lib/sports/football-data/fixture-sync";
import { SportsApiConfigError } from "@/lib/sports/env.server";

function getSyncRedirectPath(params: Record<string, string>) {
  const searchParams = new URLSearchParams(params);

  return `/admin/sync?${searchParams.toString()}`;
}

function getSyncErrorMessage(error: unknown) {
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
      return "Football-Data no encontró fixtures para la competencia o temporada solicitada.";
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

  return "No pudimos sincronizar los fixtures oficiales.";
}

export async function syncFootballDataFixturesAction() {
  const isDevelopment = process.env.NODE_ENV !== "production";

  if (!isDevelopment) {
    redirect(
      getSyncRedirectPath({
        sync_error: "La sincronización oficial está desactivada en producción.",
      }),
    );
  }

  let redirectPath: string;

  try {
    const result = await syncFootballDataFixtures();

    revalidatePath("/dashboard");
    revalidatePath("/admin/sync");

    redirectPath = getSyncRedirectPath({
      sync_estado: "ok",
      sync_matches: String(result.matchesUpserted),
      sync_reset: result.rateLimitReset ?? "",
      sync_run: result.syncRunId,
      sync_teams: String(result.teamsUpserted),
      sync_text:
        `Insertados: ${result.matchesInserted}. ` +
        `Actualizados: ${result.matchesUpdated}. ` +
        "Predicciones modificadas: 0.",
    });
  } catch (error) {
    if (isDevelopment) {
      console.error("[syncFootballDataFixturesAction]", {
        message: error instanceof Error ? error.message : "unknown",
        name: error instanceof Error ? error.name : "unknown",
      });
    }

    redirectPath = getSyncRedirectPath({
      sync_error: getSyncErrorMessage(error),
    });
  }

  redirect(redirectPath);
}

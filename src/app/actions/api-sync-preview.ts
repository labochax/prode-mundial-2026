"use server";

import { redirect } from "next/navigation";

import {
  fetchFootballDataDryRunPreview,
  FootballDataApiError,
} from "@/lib/sports/football-data/client";
import { SportsApiConfigError } from "@/lib/sports/env.server";

function getPreviewRedirectPath(params: Record<string, string>) {
  const searchParams = new URLSearchParams(params);

  return `/admin/sync?${searchParams.toString()}`;
}

function getPreviewErrorMessage(error: unknown) {
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
      return "Football-Data no encontró el endpoint o la competencia solicitada.";
    }

    return error.message;
  }

  if (
    error instanceof TypeError ||
    (error instanceof Error && error.message.toLowerCase().includes("fetch"))
  ) {
    return "No pudimos conectar con Football-Data. Revisá la red y probá de nuevo.";
  }

  return "No pudimos obtener la vista previa de Football-Data.";
}

export async function previewFootballDataDryRunAction() {
  const shouldLogDev = process.env.NODE_ENV !== "production";

  if (!shouldLogDev) {
    redirect(
      getPreviewRedirectPath({
        api_error: "La vista previa API está desactivada en producción.",
      }),
    );
  }

  let redirectPath: string;

  try {
    const preview = await fetchFootballDataDryRunPreview({
      competitionCode: "WC",
      season: "2026",
    });
    const sampleTeams = preview.teams
      .slice(0, 4)
      .map((team) => team.name_es)
      .join(", ");
    const sampleMatches = preview.matches
      .slice(0, 4)
      .map((match) => `${match.status} ${match.stage ?? "sin fase"}`)
      .join(", ");

    redirectPath = getPreviewRedirectPath({
      api_estado: "ok",
      api_matches: String(preview.matches.length),
      api_reset: preview.rateLimit.requestCounterReset ?? "",
      api_teams: String(preview.teams.length),
      api_texto:
        `Equipos: ${sampleTeams || "sin muestra"}. ` +
        `Partidos: ${sampleMatches || "sin muestra"}.`,
    });
  } catch (error) {
    if (shouldLogDev) {
      console.error("[previewFootballDataDryRunAction]", {
        message: error instanceof Error ? error.message : "unknown",
        name: error instanceof Error ? error.name : "unknown",
      });
    }

    redirectPath = getPreviewRedirectPath({
      api_error: getPreviewErrorMessage(error),
    });
  }

  redirect(redirectPath);
}

import { Trophy, Wrench } from "lucide-react";
import { redirect } from "next/navigation";

import { syncFootballDataFixturesAction } from "@/app/actions/api-sync-fixtures";
import { previewFootballDataDryRunAction } from "@/app/actions/api-sync-preview";
import { finalizeAndScoreMatchAction } from "@/app/actions/dev-scoring";
import { AuthenticatedAppShell } from "@/components/layout/authenticated-app-shell";
import { ProdeBadge } from "@/components/prode/prode-badge";
import { ProdeCard } from "@/components/prode/prode-card";
import { ensureCurrentProfile } from "@/lib/supabase/profile-bootstrap";
import { getActiveUpcomingMatchesWithDetails } from "@/lib/supabase/queries/matches";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type AdminSyncPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchValue(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];

  return Array.isArray(value) ? value[0] : value;
}

function formatMatchDate(kickoffAt: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(kickoffAt));
}

export default async function AdminSyncPage({
  searchParams,
}: AdminSyncPageProps) {
  const supabase = await createSupabaseServerClient();
  const current = await ensureCurrentProfile(supabase);

  if (!current) {
    redirect("/login");
  }

  const resolvedSearchParams = await searchParams;
  const successState = getSearchValue(resolvedSearchParams, "estado");
  const errorState = getSearchValue(resolvedSearchParams, "error");
  const apiPreviewState = getSearchValue(resolvedSearchParams, "api_estado");
  const apiPreviewError = getSearchValue(resolvedSearchParams, "api_error");
  const apiPreviewTeams = getSearchValue(resolvedSearchParams, "api_teams");
  const apiPreviewMatches = getSearchValue(resolvedSearchParams, "api_matches");
  const apiPreviewText = getSearchValue(resolvedSearchParams, "api_texto");
  const apiPreviewReset = getSearchValue(resolvedSearchParams, "api_reset");
  const fixtureSyncState = getSearchValue(resolvedSearchParams, "sync_estado");
  const fixtureSyncError = getSearchValue(resolvedSearchParams, "sync_error");
  const fixtureSyncTeams = getSearchValue(resolvedSearchParams, "sync_teams");
  const fixtureSyncMatches = getSearchValue(resolvedSearchParams, "sync_matches");
  const fixtureSyncRun = getSearchValue(resolvedSearchParams, "sync_run");
  const fixtureSyncText = getSearchValue(resolvedSearchParams, "sync_text");
  const fixtureSyncReset = getSearchValue(resolvedSearchParams, "sync_reset");
  const scoredPredictions = getSearchValue(resolvedSearchParams, "predicciones");
  const isProduction = process.env.NODE_ENV === "production";
  const activeMatches = isProduction
    ? { matches: [], source: "seed" as const }
    : await getActiveUpcomingMatchesWithDetails(supabase);
  const matches = activeMatches.matches;

  return (
    <AuthenticatedAppShell
      className="max-w-[88rem] gap-8"
      description="Herramienta local de prueba. No usar como panel admin productivo."
      eyebrow="Prueba local"
      title="Puntaje de desarrollo"
    >
      <ProdeCard className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 border-b-[3px] border-prode-black pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <ProdeBadge variant="primary">Solo local</ProdeBadge>
            <h1 className="mt-4 font-display text-5xl uppercase leading-none sm:text-6xl">
              Finalizar y puntuar
            </h1>
            <p className="mt-3 max-w-3xl font-body text-base">
              Herramienta local de prueba. No usar como panel admin productivo.
              Actualiza resultados de prueba y ejecuta el cálculo SQL de puntos.
            </p>
          </div>
          <Wrench aria-hidden="true" className="size-10 shrink-0 stroke-[2.5]" />
        </div>

        {(successState || errorState || isProduction) && (
          <div
            className={cn(
              "prode-frame mt-5 px-4 py-3 font-technical text-xs font-bold uppercase",
              errorState || isProduction
                ? "bg-[#ffe2d8] text-red-800"
                : "bg-prode-yellow text-prode-black",
            )}
          >
            {isProduction
              ? "Esta herramienta está desactivada en producción."
              : errorState
                ? errorState
                : `Partido puntuado. Predicciones actualizadas: ${
                    scoredPredictions ?? "0"
                  }.`}
          </div>
        )}
      </ProdeCard>

      <ProdeCard className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 border-b-[3px] border-prode-black pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <ProdeBadge variant="surface">Vista previa API</ProdeBadge>
            <h2 className="mt-4 font-display text-4xl uppercase leading-none sm:text-5xl">
              Probar Football-Data
            </h2>
            <p className="mt-3 max-w-3xl font-body text-base">
              La vista previa muestra una muestra limitada, mapea candidatos y
              no escribe en la base.
            </p>
          </div>

          <form action={previewFootballDataDryRunAction}>
            <button
              className="prode-frame prode-hard-shadow prode-pressable inline-flex min-h-14 items-center justify-center bg-prode-yellow px-4 py-3 font-technical text-xs font-bold uppercase text-prode-black outline-none focus-visible:ring-[3px] focus-visible:ring-prode-black focus-visible:ring-offset-[3px] focus-visible:ring-offset-prode-paper disabled:pointer-events-none disabled:opacity-50"
              disabled={isProduction}
              type="submit"
            >
              Probar Football-Data
            </button>
          </form>
        </div>

        {(apiPreviewState || apiPreviewError || isProduction) && (
          <div
            className={cn(
              "prode-frame mt-5 px-4 py-3 font-technical text-xs font-bold uppercase",
              apiPreviewError || isProduction
                ? "bg-[#ffe2d8] text-red-800"
                : "bg-prode-yellow text-prode-black",
            )}
          >
            {isProduction
              ? "La vista previa API está desactivada en producción."
              : apiPreviewError
                ? apiPreviewError
                : `Sin escrituras DB. Equipos: ${apiPreviewTeams ?? "0"} / Partidos: ${
                    apiPreviewMatches ?? "0"
                  }. ${apiPreviewText ?? ""} ${
                    apiPreviewReset
                      ? `Reset de cuota en ${apiPreviewReset}s.`
                      : ""
                  }`}
          </div>
        )}
      </ProdeCard>

      <ProdeCard className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 border-b-[3px] border-prode-black pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <ProdeBadge variant="primary">Sincronización oficial</ProdeBadge>
            <h2 className="mt-4 font-display text-4xl uppercase leading-none sm:text-5xl">
              Partidos Football-Data
            </h2>
            <p className="mt-3 max-w-3xl font-body text-base">
              Importa equipos y partidos oficiales en Supabase local. No borra
              datos existentes, no modifica predicciones y no ejecuta puntaje.
              Cuando hay partidos oficiales, las pantallas principales ocultan
              los partidos de prueba del seed.
            </p>
          </div>

          <form action={syncFootballDataFixturesAction}>
            <button
              className="prode-frame prode-hard-shadow prode-pressable inline-flex min-h-14 items-center justify-center bg-prode-yellow px-4 py-3 font-technical text-xs font-bold uppercase text-prode-black outline-none focus-visible:ring-[3px] focus-visible:ring-prode-black focus-visible:ring-offset-[3px] focus-visible:ring-offset-prode-paper disabled:pointer-events-none disabled:opacity-50"
              disabled={isProduction}
              type="submit"
            >
              Sincronizar fixtures oficiales
            </button>
          </form>
        </div>

        {(fixtureSyncState || fixtureSyncError || isProduction) && (
          <div
            className={cn(
              "prode-frame mt-5 px-4 py-3 font-technical text-xs font-bold uppercase",
              fixtureSyncError || isProduction
                ? "bg-[#ffe2d8] text-red-800"
                : "bg-prode-yellow text-prode-black",
            )}
          >
            {isProduction
              ? "La sincronización oficial está desactivada en producción."
              : fixtureSyncError
                ? fixtureSyncError
                : `Ejecución ${
                    fixtureSyncRun ?? "local"
                  } completada. Equipos: ${
                    fixtureSyncTeams ?? "0"
                  } / Partidos: ${fixtureSyncMatches ?? "0"}. ${
                    fixtureSyncText ?? "Predicciones modificadas: 0."
                  } ${
                    fixtureSyncReset
                      ? `Reset de cuota en ${fixtureSyncReset}s.`
                      : ""
                  }`}
          </div>
        )}
      </ProdeCard>

      {isProduction ? (
        <ProdeCard className="p-6">
          <ProdeBadge variant="surface">No disponible</ProdeBadge>
          <h2 className="mt-4 font-display text-4xl uppercase leading-none">
            Herramienta desactivada
          </h2>
          <p className="mt-3 max-w-2xl font-body text-base">
            El puntaje productivo requiere autorización admin real y un flujo de
            sincronización seguro.
          </p>
        </ProdeCard>
      ) : (
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {matches.map((match) => {
            const isFinished = match.status === "FINISHED";

            return (
              <ProdeCard className="p-5" key={match.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <ProdeBadge variant={isFinished ? "ink" : "surface"}>
                      {isFinished ? "Finalizado" : "Pendiente"}
                    </ProdeBadge>
                    <h2 className="mt-3 font-display text-4xl uppercase leading-none">
                      {match.home_team?.name_es ?? "Equipo A"} vs{" "}
                      {match.away_team?.name_es ?? "Equipo B"}
                    </h2>
                    <p className="mt-2 font-technical text-xs font-bold uppercase text-muted-foreground">
                      {match.group_code ?? "Grupo"} -{" "}
                      {formatMatchDate(match.kickoff_at)}
                    </p>
                  </div>
                  <Trophy aria-hidden="true" className="size-8 shrink-0" />
                </div>

                <form
                  action={finalizeAndScoreMatchAction}
                  className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_auto]"
                >
                  <input name="match_id" type="hidden" value={match.id} />
                  <label className="font-technical text-xs font-bold uppercase">
                    {match.home_team?.name_es ?? "Local"}
                    <input
                      className="prode-frame mt-2 h-14 w-full bg-prode-surface px-3 font-display text-3xl outline-none focus-visible:bg-prode-yellow focus-visible:ring-[3px] focus-visible:ring-prode-black focus-visible:ring-offset-[3px] focus-visible:ring-offset-prode-paper"
                      defaultValue={match.home_score ?? 0}
                      disabled={isProduction}
                      max={99}
                      min={0}
                      name="home_score"
                      type="number"
                    />
                  </label>

                  <label className="font-technical text-xs font-bold uppercase">
                    {match.away_team?.name_es ?? "Visitante"}
                    <input
                      className="prode-frame mt-2 h-14 w-full bg-prode-surface px-3 font-display text-3xl outline-none focus-visible:bg-prode-yellow focus-visible:ring-[3px] focus-visible:ring-prode-black focus-visible:ring-offset-[3px] focus-visible:ring-offset-prode-paper"
                      defaultValue={match.away_score ?? 0}
                      disabled={isProduction}
                      max={99}
                      min={0}
                      name="away_score"
                      type="number"
                    />
                  </label>

                  <button
                    className="prode-frame prode-hard-shadow prode-pressable inline-flex min-h-14 items-center justify-center self-end bg-prode-yellow px-4 py-3 font-technical text-xs font-bold uppercase text-prode-black outline-none focus-visible:ring-[3px] focus-visible:ring-prode-black focus-visible:ring-offset-[3px] focus-visible:ring-offset-prode-paper disabled:pointer-events-none disabled:opacity-50"
                    disabled={isProduction}
                    type="submit"
                  >
                    Finalizar y puntuar
                  </button>
                </form>
              </ProdeCard>
            );
          })}
        </section>
      )}
    </AuthenticatedAppShell>
  );
}

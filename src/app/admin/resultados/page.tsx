import { RefreshCw, ShieldAlert, Trophy } from "lucide-react";
import { redirect } from "next/navigation";

import {
  AdminFinalizeMatchForm,
  AdminResultsSyncForm,
} from "@/components/admin/admin-result-controls";
import { AuthenticatedAppShell } from "@/components/layout/authenticated-app-shell";
import { ProdeBadge } from "@/components/prode/prode-badge";
import { ProdeCard } from "@/components/prode/prode-card";
import { getCurrentAdminAuthorization } from "@/lib/admin/admin-authorization.server";
import {
  getAdminResultMatches,
  type AdminResultMatch,
} from "@/lib/admin/results-query.server";
import { getMatchStageLabel } from "@/lib/matches/dashboard-stage";
import { cn } from "@/lib/utils";

type AdminResultsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchValue(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

function formatKickoff(kickoffAt: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(kickoffAt));
}

function getTeamName(
  team: AdminResultMatch["home_team"] | AdminResultMatch["away_team"],
  fallback: string,
) {
  return team?.name_es ?? team?.name_en ?? team?.tla ?? fallback;
}

function getStatusLabel(status: string) {
  switch (status) {
    case "AWARDED":
      return "Asignado";
    case "CANCELLED":
      return "Cancelado";
    case "EXTRA_TIME":
      return "Alargue";
    case "FINISHED":
      return "Finalizado";
    case "IN_PLAY":
      return "En juego";
    case "PAUSED":
      return "Entretiempo";
    case "PENALTY_SHOOTOUT":
      return "Penales";
    case "POSTPONED":
      return "Postergado";
    case "SUSPENDED":
      return "Suspendido";
    default:
      return "Programado";
  }
}

function UnauthorizedState() {
  return (
    <AuthenticatedAppShell
      description="Esta herramienta está reservada para la administración del Prode."
      eyebrow="Administración"
      title="Control de resultados"
    >
      <ProdeCard className="border-red-700 bg-[#ffe2d8] p-6 text-red-950">
        <div className="flex items-start gap-4">
          <ShieldAlert aria-hidden="true" className="size-9 shrink-0" />
          <div>
            <ProdeBadge className="border-red-700 bg-red-600 text-white">
              No autorizado
            </ProdeBadge>
            <h2 className="mt-4 font-display text-4xl uppercase leading-none">
              Acceso restringido
            </h2>
            <p className="mt-3 font-body text-base">
              Tu cuenta no está incluida en ADMIN_EMAILS.
            </p>
          </div>
        </div>
      </ProdeCard>
    </AuthenticatedAppShell>
  );
}

export default async function AdminResultsPage({
  searchParams,
}: AdminResultsPageProps) {
  const authorization = await getCurrentAdminAuthorization();

  if (authorization.status === "unauthenticated") {
    redirect("/login?next=/admin/resultados");
  }

  if (authorization.status === "unauthorized") {
    return <UnauthorizedState />;
  }

  const [matches, resolvedSearchParams] = await Promise.all([
    getAdminResultMatches(),
    searchParams,
  ]);
  const syncError = getSearchValue(resolvedSearchParams, "sync_error");
  const syncState = getSearchValue(resolvedSearchParams, "sync_estado");
  const finalError = getSearchValue(resolvedSearchParams, "final_error");
  const finalState = getSearchValue(resolvedSearchParams, "final_estado");

  return (
    <AuthenticatedAppShell
      className="max-w-4xl gap-6"
      description="Sincronizá resultados oficiales o finalizá un partido manualmente cuando el proveedor esté demorado."
      eyebrow="Administración"
      title="Control de resultados"
    >
      <ProdeCard className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <ProdeBadge variant="primary">Sincronización</ProdeBadge>
            <h2 className="mt-3 font-display text-4xl uppercase leading-none">
              Football-Data
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Ejecuta el sync de resultados con protección contra datos
              desactualizados. Los partidos finalizados completos se puntúan.
            </p>
          </div>
          <RefreshCw aria-hidden="true" className="size-8 shrink-0" />
        </div>

        <div className="mt-5">
          <AdminResultsSyncForm />
        </div>

        {(syncState || syncError) && (
          <div
            className={cn(
              "prode-frame mt-5 px-4 py-3 font-technical text-xs font-bold uppercase",
              syncError
                ? "border-red-700 bg-[#ffe2d8] text-red-900"
                : "bg-prode-yellow text-prode-black",
            )}
          >
            {syncError
              ? syncError
              : `Revisados: ${getSearchValue(resolvedSearchParams, "sync_checked") ?? "0"}. Actualizados: ${
                  getSearchValue(resolvedSearchParams, "sync_updated") ?? "0"
                }. Finalizados puntuados: ${
                  getSearchValue(resolvedSearchParams, "sync_finished") ?? "0"
                }. Predicciones puntuadas: ${
                  getSearchValue(resolvedSearchParams, "sync_scored") ?? "0"
                }. Datos desactualizados protegidos: ${
                  getSearchValue(resolvedSearchParams, "sync_stale") ?? "0"
                }. 16avos mapeados: ${
                  getSearchValue(resolvedSearchParams, "sync_knockout_applied") ??
                  "0"
                }. 16avos corregidos: ${
                  getSearchValue(
                    resolvedSearchParams,
                    "sync_knockout_corrected",
                  ) ?? "0"
                }. 16avos sin equipo local: ${
                  getSearchValue(
                    resolvedSearchParams,
                    "sync_knockout_missing_team",
                  ) ?? "0"
                }. 16avos sin mapa oficial: ${
                  getSearchValue(
                    resolvedSearchParams,
                    "sync_knockout_missing_map",
                  ) ?? "0"
                }. Octavos slots resueltos: ${
                  getSearchValue(resolvedSearchParams, "sync_r16_resolved") ??
                  "0"
                }. Octavos desbloqueados: ${
                  getSearchValue(resolvedSearchParams, "sync_r16_unlocked") ??
                  "0"
                }. Octavos corregidos: ${
                  getSearchValue(resolvedSearchParams, "sync_r16_corrected") ??
                  "0"
                }. Octavos esperando ganador: ${
                  getSearchValue(resolvedSearchParams, "sync_r16_waiting") ??
                  "0"
                }. Cuota por minuto: ${
                  getSearchValue(resolvedSearchParams, "sync_minute") ?? "sin dato"
                }.`}
          </div>
        )}
      </ProdeCard>

      {(finalState || finalError) && (
        <div
          className={cn(
            "prode-frame prode-hard-shadow px-4 py-4 font-technical text-xs font-bold uppercase",
            finalError
              ? "border-red-700 bg-[#ffe2d8] text-red-900"
              : "bg-prode-yellow text-prode-black",
          )}
        >
          {finalError
            ? finalError
            : `${getSearchValue(resolvedSearchParams, "final_match") ?? "Partido"}: ${
                getSearchValue(resolvedSearchParams, "final_home") ?? "0"
              } - ${getSearchValue(resolvedSearchParams, "final_away") ?? "0"}. Predicciones puntuadas: ${
                getSearchValue(resolvedSearchParams, "final_scored") ?? "0"
              }.`}
        </div>
      )}

      <section className="grid gap-4">
        <div>
          <ProdeBadge variant="surface">Finalizar manualmente</ProdeBadge>
          <h2 className="mt-3 font-display text-4xl uppercase leading-none">
            Partidos para controlar
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Incluye las últimas 36 horas, las próximas 6 horas y cualquier
            partido vencido que todavía no figure finalizado.
          </p>
        </div>

        {matches.length === 0 ? (
          <ProdeCard className="p-6">
            <p className="font-technical text-sm font-bold uppercase">
              No hay partidos para controlar en este momento.
            </p>
          </ProdeCard>
        ) : (
          matches.map((match) => {
            const homeName = getTeamName(match.home_team, "Por definir");
            const awayName = getTeamName(match.away_team, "Por definir");
            const hasOfficialTeams = Boolean(
              match.home_team_id && match.away_team_id,
            );

            return (
              <ProdeCard className="p-4 sm:p-5" key={match.id}>
                <div className="flex items-start justify-between gap-3 border-b-[3px] border-prode-black pb-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <ProdeBadge variant={match.status === "FINISHED" ? "ink" : "surface"}>
                        {getStatusLabel(match.status)}
                      </ProdeBadge>
                      <span className="font-technical text-xs font-bold uppercase text-muted-foreground">
                        M{match.match_number ?? "?"} ·{" "}
                        {getMatchStageLabel(match)}
                      </span>
                    </div>
                    <h3 className="mt-3 font-display text-3xl uppercase leading-none sm:text-4xl">
                      {homeName} vs {awayName}
                    </h3>
                    <p className="mt-2 font-technical text-xs font-bold uppercase text-muted-foreground">
                      {formatKickoff(match.kickoff_at)}
                    </p>
                  </div>
                  <Trophy aria-hidden="true" className="size-7 shrink-0" />
                </div>

                {match.home_score !== null && match.away_score !== null && (
                  <p className="mt-4 font-technical text-xs font-bold uppercase">
                    Resultado actual: {homeName} {match.home_score} -{" "}
                    {match.away_score} {awayName}
                  </p>
                )}

                {!hasOfficialTeams && (
                  <div className="prode-frame mt-4 border-red-700 bg-[#ffe2d8] px-3 py-3 font-technical text-xs font-bold uppercase text-red-900">
                    No se puede finalizar: faltan equipos oficiales asignados.
                  </div>
                )}

                <div className="mt-4">
                  <AdminFinalizeMatchForm
                    awayName={awayName}
                    currentAwayScore={match.away_score}
                    currentHomeScore={match.home_score}
                    disabled={!hasOfficialTeams}
                    homeName={homeName}
                    matchId={match.id}
                  />
                </div>
              </ProdeCard>
            );
          })
        )}
      </section>
    </AuthenticatedAppShell>
  );
}

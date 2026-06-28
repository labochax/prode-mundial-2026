import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { fetchFootballDataResultsSyncCandidates } from "@/lib/sports/football-data/client";
import {
  applyFootballDataResultUpdateDecision,
  getFootballDataResultUpdateDecision,
} from "@/lib/sports/football-data/result-update-decision";
import { getFootballDataResultUpdateRow } from "@/lib/sports/football-data/result-update-row";
import {
  getStadiumIdForMatchCandidate,
  syncFootballDataMatchStadiums,
} from "@/lib/sports/football-data/stadium-sync";
import {
  getRelatedTeamIds,
  getTeamIdLookup,
} from "@/lib/sports/football-data/team-id-lookup";
import { syncOfficialKnockoutTeamsFromGroupResults } from "@/lib/tournament/official-knockout-resolver";
import type {
  FootballDataMatchCandidate,
  FootballDataMatchStatus,
  FootballDataResultsSyncCandidates,
} from "@/lib/sports/football-data/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/lib/supabase/database.types";

type SupabaseAdminClient = SupabaseClient<Database>;
type SyncRunInsert = Database["public"]["Tables"]["sync_runs"]["Insert"];
type SyncRunUpdate = Database["public"]["Tables"]["sync_runs"]["Update"];
type FootballDataResultsSyncTrigger = "cron" | "manual";
type TeamIdLookup = Awaited<ReturnType<typeof getTeamIdLookup>>;

type ExistingMatch = Pick<
  Database["public"]["Tables"]["matches"]["Row"],
  | "away_score"
  | "football_data_id"
  | "home_score"
  | "id"
  | "last_synced_at"
  | "raw_json"
  | "status"
  | "winner"
>;

const liveStatuses = new Set<FootballDataMatchStatus>([
  "EXTRA_TIME",
  "IN_PLAY",
  "PAUSED",
  "PENALTY_SHOOTOUT",
]);

const stoppedStatuses = new Set<FootballDataMatchStatus>([
  "AWARDED",
  "CANCELLED",
  "POSTPONED",
  "SUSPENDED",
]);

export type FootballDataResultsSyncResult = {
  checkedMatches: number;
  finishedMatchesScored: number;
  knockoutMatchesUnlocked: number;
  knockoutTeamSlotsResolved: number;
  knockoutTeamSlotsSkipped: number;
  liveMatchesUpdated: number;
  matchesUpdated: number;
  predictionsChanged: 0;
  rateLimitReset: string | null;
  requestsAvailable: string | null;
  requestsAvailableMinute: string | null;
  scoredPredictions: number;
  staleResultsSkipped: number;
  stoppedMatchesUpdated: number;
  syncRunId: string;
  stadiumsUpserted: number;
};

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

async function createSyncRun(
  client: SupabaseAdminClient,
  trigger: FootballDataResultsSyncTrigger,
) {
  const insertRow = {
    provider: "football-data",
    status: "running",
    sync_type: "results",
    summary: {
      note:
        trigger === "cron"
          ? "Sync automatizable de resultados iniciada desde la ruta cron."
          : "Sync manual de resultados iniciada desde una acción admin.",
      trigger,
    },
  } satisfies SyncRunInsert;

  const { data, error } = await client
    .from("sync_runs")
    .insert(insertRow)
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data.id;
}

async function updateSyncRun(
  client: SupabaseAdminClient,
  syncRunId: string,
  updateRow: SyncRunUpdate,
) {
  const { error } = await client
    .from("sync_runs")
    .update(updateRow)
    .eq("id", syncRunId);

  if (error) {
    throw error;
  }
}

async function recordProviderError(
  client: SupabaseAdminClient,
  syncRunId: string,
  error: unknown,
  context: string,
) {
  await client.from("provider_errors").insert({
    context,
    details:
      error instanceof Error
        ? {
            name: error.name,
          }
        : null,
    message: error instanceof Error ? error.message : "Error desconocido.",
    provider: "football-data",
    sync_run_id: syncRunId,
  });
}

async function getExistingMatches(
  client: SupabaseAdminClient,
  footballDataMatchIds: number[],
) {
  const uniqueIds = [...new Set(footballDataMatchIds)];

  if (uniqueIds.length === 0) {
    return new Map<number, ExistingMatch>();
  }

  const { data, error } = await client
    .from("matches")
    .select(
      "id, football_data_id, status, home_score, away_score, winner, last_synced_at, raw_json",
    )
    .in("football_data_id", uniqueIds);

  if (error) {
    throw error;
  }

  return new Map(
    data
      .filter((match) => typeof match.football_data_id === "number")
      .map((match) => [match.football_data_id as number, match]),
  );
}

function getResultUpdateRow(
  match: FootballDataMatchCandidate,
  stadiumIdsByVenue: Map<string, string>,
  teamIds: TeamIdLookup,
) {
  const stadiumId = getStadiumIdForMatchCandidate(match, stadiumIdsByVenue);

  return getFootballDataResultUpdateRow(match, {
    stadiumId,
    teamIds,
  });
}

async function updateResultMatch(
  client: SupabaseAdminClient,
  matchId: string,
  candidate: FootballDataMatchCandidate,
  stadiumIdsByVenue: Map<string, string>,
  teamIds: TeamIdLookup,
) {
  const { error } = await client
    .from("matches")
    .update(getResultUpdateRow(candidate, stadiumIdsByVenue, teamIds))
    .eq("id", matchId);

  if (error) {
    throw error;
  }
}

async function syncResultsToDatabase(
  client: SupabaseAdminClient,
  candidates: FootballDataResultsSyncCandidates,
) {
  const existingMatches = await getExistingMatches(
    client,
    candidates.matches.map((match) => match.football_data_id),
  );
  let matchesUpdated = 0;
  let liveMatchesUpdated = 0;
  let stoppedMatchesUpdated = 0;
  let finishedMatchesScored = 0;
  let scoredPredictions = 0;
  let staleResultsSkipped = 0;
  const { stadiumIdsByVenue, stadiumsUpserted } =
    await syncFootballDataMatchStadiums(client, candidates.matches);
  const teamIds = await getTeamIdLookup(
    client,
    getRelatedTeamIds(candidates.matches),
  );

  for (const candidate of candidates.matches) {
    const existingMatch = existingMatches.get(candidate.football_data_id);

    if (!existingMatch) {
      continue;
    }

    const decision = getFootballDataResultUpdateDecision(
      existingMatch,
      candidate,
    );
    const operationResult = await applyFootballDataResultUpdateDecision(
      decision,
      {
        applyUpdate: () =>
          updateResultMatch(
            client,
            existingMatch.id,
            candidate,
            stadiumIdsByVenue,
            teamIds,
          ),
        scorePredictions: async () => {
          const { data, error } = await client.rpc("score_match_predictions", {
            target_match_id: existingMatch.id,
          });

          if (error) {
            throw error;
          }

          return data ?? 0;
        },
      },
    );

    matchesUpdated += operationResult.matchesUpdated;
    finishedMatchesScored += operationResult.finishedMatchesScored;
    scoredPredictions += operationResult.scoredPredictions;
    staleResultsSkipped += operationResult.staleResultsSkipped;

    if (operationResult.matchesUpdated === 1) {
      if (liveStatuses.has(candidate.status)) {
        liveMatchesUpdated += 1;
      }

      if (stoppedStatuses.has(candidate.status)) {
        stoppedMatchesUpdated += 1;
      }
    }
  }
  const {
    knockoutMatchesUnlocked,
    knockoutTeamSlotsResolved,
    knockoutTeamSlotsSkipped,
  } = await syncOfficialKnockoutTeamsFromGroupResults(client);

  return {
    finishedMatchesScored,
    knockoutMatchesUnlocked,
    knockoutTeamSlotsResolved,
    knockoutTeamSlotsSkipped,
    liveMatchesUpdated,
    matchesUpdated,
    scoredPredictions,
    staleResultsSkipped,
    stoppedMatchesUpdated,
    stadiumsUpserted,
  };
}

export async function syncFootballDataResults(
  options: { trigger?: FootballDataResultsSyncTrigger } = {},
): Promise<FootballDataResultsSyncResult> {
  const client = createSupabaseAdminClient();
  const syncRunId = await createSyncRun(client, options.trigger ?? "manual");

  try {
    const candidates = await fetchFootballDataResultsSyncCandidates({
      competitionCode: "WC",
      season: "2026",
    });
    const {
      finishedMatchesScored,
      knockoutMatchesUnlocked,
      knockoutTeamSlotsResolved,
      knockoutTeamSlotsSkipped,
      liveMatchesUpdated,
      matchesUpdated,
      scoredPredictions,
      staleResultsSkipped,
      stoppedMatchesUpdated,
      stadiumsUpserted,
    } = await syncResultsToDatabase(client, candidates);
    const result = {
      checkedMatches: candidates.matches.length,
      finishedMatchesScored,
      knockoutMatchesUnlocked,
      knockoutTeamSlotsResolved,
      knockoutTeamSlotsSkipped,
      liveMatchesUpdated,
      matchesUpdated,
      predictionsChanged: 0,
      rateLimitReset: candidates.rateLimit.requestCounterReset,
      requestsAvailable: candidates.rateLimit.requestsAvailable,
      requestsAvailableMinute: candidates.rateLimit.requestsAvailableMinute,
      scoredPredictions,
      staleResultsSkipped,
      stoppedMatchesUpdated,
      syncRunId,
      stadiumsUpserted,
    } satisfies FootballDataResultsSyncResult;

    await updateSyncRun(client, syncRunId, {
      finished_at: new Date().toISOString(),
      status: "success",
      summary: toJson(result),
    });

    return result;
  } catch (error) {
    try {
      await recordProviderError(client, syncRunId, error, "results");
    } catch (providerError) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[syncFootballDataResults:provider-error]", {
          message:
            providerError instanceof Error ? providerError.message : "unknown",
          name: providerError instanceof Error ? providerError.name : "unknown",
        });
      }
    }

    try {
      await updateSyncRun(client, syncRunId, {
        error_message:
          error instanceof Error ? error.message : "Error desconocido.",
        finished_at: new Date().toISOString(),
        status: "error",
        summary: toJson({
          predictions_changed: 0,
        }),
      });
    } catch (syncRunError) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[syncFootballDataResults:sync-run-error]", {
          message:
            syncRunError instanceof Error ? syncRunError.message : "unknown",
          name: syncRunError instanceof Error ? syncRunError.name : "unknown",
        });
      }
    }

    throw error;
  }
}

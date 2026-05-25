import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { fetchFootballDataFixtureSyncCandidates } from "@/lib/sports/football-data/client";
import type {
  FootballDataFixtureSyncCandidates,
  FootballDataMatchCandidate,
} from "@/lib/sports/football-data/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/lib/supabase/database.types";

type SupabaseAdminClient = SupabaseClient<Database>;
type MatchInsert = Database["public"]["Tables"]["matches"]["Insert"];
type MatchUpdate = Database["public"]["Tables"]["matches"]["Update"];
type SyncRunInsert = Database["public"]["Tables"]["sync_runs"]["Insert"];
type SyncRunUpdate = Database["public"]["Tables"]["sync_runs"]["Update"];

type TeamIdLookup = Map<number, string>;
type FootballDataFixtureSyncTrigger = "cron" | "manual";

export type FootballDataFixtureSyncResult = {
  fetchedMatches: number;
  fetchedTeams: number;
  matchesInserted: number;
  matchesUpdated: number;
  matchesUpserted: number;
  predictionsChanged: 0;
  rateLimitReset: string | null;
  requestsAvailable: string | null;
  requestsAvailableMinute: string | null;
  syncRunId: string;
  teamsUpserted: number;
};

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

async function createSyncRun(
  client: SupabaseAdminClient,
  trigger: FootballDataFixtureSyncTrigger,
) {
  const insertRow = {
    provider: "football-data",
    status: "running",
    sync_type: "fixtures",
    summary: {
      note:
        trigger === "cron"
          ? "Sync automatizable iniciada desde la ruta cron."
          : "Sync local/manual iniciada desde /admin/sync.",
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

async function upsertTeams(
  client: SupabaseAdminClient,
  candidates: FootballDataFixtureSyncCandidates["teams"],
) {
  if (candidates.length === 0) {
    return 0;
  }

  const rows = candidates.map((team) => ({
    badge_url: team.badge_url,
    flag_url: team.flag_url,
    football_data_id: team.football_data_id,
    name_en: team.name_en,
    name_es: team.name_es,
    raw_json: team.raw_json,
    short_name: team.short_name,
    tla: team.tla,
  }));

  const { data, error } = await client
    .from("teams")
    .upsert(rows, {
      onConflict: "football_data_id",
    })
    .select("id");

  if (error) {
    throw error;
  }

  return data.length;
}

async function getTeamIdLookup(
  client: SupabaseAdminClient,
  footballDataTeamIds: number[],
): Promise<TeamIdLookup> {
  const uniqueIds = [...new Set(footballDataTeamIds)];

  if (uniqueIds.length === 0) {
    return new Map();
  }

  const { data, error } = await client
    .from("teams")
    .select("id, football_data_id")
    .in("football_data_id", uniqueIds);

  if (error) {
    throw error;
  }

  return new Map(
    data
      .filter((team) => typeof team.football_data_id === "number")
      .map((team) => [team.football_data_id as number, team.id]),
  );
}

function getRelatedTeamIds(matches: FootballDataMatchCandidate[]) {
  return matches.flatMap((match) =>
    [
      match.home_team_football_data_id,
      match.away_team_football_data_id,
    ].filter((value): value is number => typeof value === "number"),
  );
}

function getMatchBaseRow(
  match: FootballDataMatchCandidate,
  teamIds: TeamIdLookup,
) {
  return {
    away_score: match.away_score,
    away_team_id:
      typeof match.away_team_football_data_id === "number"
        ? teamIds.get(match.away_team_football_data_id) ?? null
        : null,
    football_data_id: match.football_data_id,
    group_code: match.group_code,
    home_score: match.home_score,
    home_team_id:
      typeof match.home_team_football_data_id === "number"
        ? teamIds.get(match.home_team_football_data_id) ?? null
        : null,
    kickoff_at: match.kickoff_at,
    last_synced_at: match.last_synced_at,
    match_number: match.match_number,
    minute: match.minute,
    raw_json: match.raw_json,
    stage: match.stage,
    status: match.status,
    winner: match.winner,
  };
}

async function getExistingMatchIds(
  client: SupabaseAdminClient,
  footballDataMatchIds: number[],
) {
  if (footballDataMatchIds.length === 0) {
    return new Set<number>();
  }

  const { data, error } = await client
    .from("matches")
    .select("football_data_id")
    .in("football_data_id", footballDataMatchIds);

  if (error) {
    throw error;
  }

  return new Set(
    data
      .map((match) => match.football_data_id)
      .filter((value): value is number => typeof value === "number"),
  );
}

async function insertMatches(
  client: SupabaseAdminClient,
  matches: FootballDataMatchCandidate[],
  teamIds: TeamIdLookup,
) {
  if (matches.length === 0) {
    return 0;
  }

  const rows = matches.map(
    (match) =>
      ({
        ...getMatchBaseRow(match, teamIds),
        // The DB trigger computes lock_at from kickoff_at and settings. The
        // generated Supabase type marks lock_at as required because the column
        // is not nullable, so this explicit null is only a typed bridge to the
        // trigger behavior.
        lock_at: null as unknown as string,
      }) satisfies MatchInsert,
  );

  const { data, error } = await client.from("matches").insert(rows).select("id");

  if (error) {
    throw error;
  }

  return data.length;
}

async function updateMatches(
  client: SupabaseAdminClient,
  matches: FootballDataMatchCandidate[],
  teamIds: TeamIdLookup,
) {
  let updated = 0;

  for (const match of matches) {
    const updateRow = getMatchBaseRow(match, teamIds) satisfies MatchUpdate;
    const { error } = await client
      .from("matches")
      .update(updateRow)
      .eq("football_data_id", match.football_data_id);

    if (error) {
      throw error;
    }

    updated += 1;
  }

  return updated;
}

async function syncCandidatesToDatabase(
  client: SupabaseAdminClient,
  candidates: FootballDataFixtureSyncCandidates,
) {
  const teamsUpserted = await upsertTeams(client, candidates.teams);
  const teamIds = await getTeamIdLookup(
    client,
    getRelatedTeamIds(candidates.matches),
  );
  const existingMatchIds = await getExistingMatchIds(
    client,
    candidates.matches.map((match) => match.football_data_id),
  );
  const matchesToUpdate = candidates.matches.filter((match) =>
    existingMatchIds.has(match.football_data_id),
  );
  const matchesToInsert = candidates.matches.filter(
    (match) => !existingMatchIds.has(match.football_data_id),
  );
  const matchesInserted = await insertMatches(client, matchesToInsert, teamIds);
  const matchesUpdated = await updateMatches(client, matchesToUpdate, teamIds);

  return {
    matchesInserted,
    matchesUpdated,
    teamsUpserted,
  };
}

export async function syncFootballDataFixtures(
  options: { trigger?: FootballDataFixtureSyncTrigger } = {},
): Promise<FootballDataFixtureSyncResult> {
  const client = createSupabaseAdminClient();
  const syncRunId = await createSyncRun(client, options.trigger ?? "manual");

  try {
    const candidates = await fetchFootballDataFixtureSyncCandidates({
      competitionCode: "WC",
      season: "2026",
    });
    const { matchesInserted, matchesUpdated, teamsUpserted } =
      await syncCandidatesToDatabase(client, candidates);
    const result = {
      fetchedMatches: candidates.matches.length,
      fetchedTeams: candidates.teams.length,
      matchesInserted,
      matchesUpdated,
      matchesUpserted: matchesInserted + matchesUpdated,
      predictionsChanged: 0,
      rateLimitReset: candidates.rateLimit.matches.requestCounterReset,
      requestsAvailable: candidates.rateLimit.matches.requestsAvailable,
      requestsAvailableMinute:
        candidates.rateLimit.matches.requestsAvailableMinute,
      syncRunId,
      teamsUpserted,
    } satisfies FootballDataFixtureSyncResult;

    await updateSyncRun(client, syncRunId, {
      finished_at: new Date().toISOString(),
      status: "success",
      summary: toJson(result),
    });

    return result;
  } catch (error) {
    try {
      await recordProviderError(client, syncRunId, error, "fixtures");
    } catch (providerError) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[syncFootballDataFixtures:provider-error]", {
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
        console.error("[syncFootballDataFixtures:sync-run-error]", {
          message:
            syncRunError instanceof Error ? syncRunError.message : "unknown",
          name: syncRunError instanceof Error ? syncRunError.name : "unknown",
        });
      }
    }

    throw error;
  }
}

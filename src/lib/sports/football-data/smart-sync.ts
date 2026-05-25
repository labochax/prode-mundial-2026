import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  syncFootballDataFixtures,
  type FootballDataFixtureSyncResult,
} from "@/lib/sports/football-data/fixture-sync";
import {
  syncFootballDataResults,
  type FootballDataResultsSyncResult,
} from "@/lib/sports/football-data/results-sync";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/lib/supabase/database.types";

type SupabaseAdminClient = SupabaseClient<Database>;
type MatchRow = Database["public"]["Tables"]["matches"]["Row"];
type SyncRunRow = Pick<
  Database["public"]["Tables"]["sync_runs"]["Row"],
  "finished_at" | "started_at"
>;

export type FootballDataCronMode = "fixtures" | "results" | "smart";

type SyncDecision<T> = {
  lastSuccessAt: string | null;
  reason: string;
  result?: T;
  run: boolean;
};

type OfficialMatchStats = {
  liveStatusMatchesCount: number;
  liveWindowMatchesCount: number;
  officialMatchesCount: number;
};

export type FootballDataSmartSyncSummary = {
  finishedAt: string;
  fixtures: SyncDecision<FootballDataFixtureSyncResult> & {
    officialMatchesCount: number;
  };
  mode: FootballDataCronMode;
  rateLimit: {
    stoppedAfterFixtures: boolean;
  };
  results: SyncDecision<FootballDataResultsSyncResult> & OfficialMatchStats;
  startedAt: string;
};

const fixtureRefreshMs = 12 * 60 * 60 * 1000;
const quietResultsRefreshMs = 60 * 60 * 1000;
const liveWindowBeforeKickoffMs = 30 * 60 * 1000;
const liveWindowAfterKickoffMs = 3 * 60 * 60 * 1000;
const lowQuotaThreshold = 1;

const liveStatuses = new Set<string>([
  "EXTRA_TIME",
  "IN_PLAY",
  "PAUSED",
  "PENALTY_SHOOTOUT",
]);

function isRecord(
  value: Json | null | undefined,
): value is Record<string, Json | undefined> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSeedFixture(
  match: Pick<MatchRow, "football_data_id" | "raw_json">,
) {
  return (
    match.football_data_id === null ||
    (isRecord(match.raw_json) && typeof match.raw_json.seed_note === "string")
  );
}

function isOfficialFixture(
  match: Pick<MatchRow, "football_data_id" | "raw_json">,
) {
  return match.football_data_id !== null && !isSeedFixture(match);
}

function isOlderThan(
  timestamp: string | null,
  now: Date,
  intervalMs: number,
) {
  if (!timestamp) {
    return true;
  }

  return now.getTime() - new Date(timestamp).getTime() > intervalMs;
}

function getLiveWindowStats(matches: MatchRow[], now: Date) {
  const nowMs = now.getTime();

  return matches.reduce(
    (stats, match) => {
      const kickoffMs = new Date(match.kickoff_at).getTime();
      const isNearLiveWindow =
        kickoffMs - liveWindowBeforeKickoffMs <= nowMs &&
        kickoffMs + liveWindowAfterKickoffMs >= nowMs;
      const hasLiveStatus = liveStatuses.has(match.status);

      return {
        liveStatusMatchesCount:
          stats.liveStatusMatchesCount + (hasLiveStatus ? 1 : 0),
        liveWindowMatchesCount:
          stats.liveWindowMatchesCount + (isNearLiveWindow ? 1 : 0),
      };
    },
    {
      liveStatusMatchesCount: 0,
      liveWindowMatchesCount: 0,
    },
  );
}

function hasLowQuota(
  result: Pick<
    FootballDataFixtureSyncResult | FootballDataResultsSyncResult,
    "requestsAvailable" | "requestsAvailableMinute"
  >,
) {
  const remaining = Number(
    result.requestsAvailableMinute ?? result.requestsAvailable ?? NaN,
  );

  return Number.isFinite(remaining) && remaining <= lowQuotaThreshold;
}

async function getLatestSuccessfulSyncRun(
  client: SupabaseAdminClient,
  syncType: "fixtures" | "results",
) {
  const { data, error } = await client
    .from("sync_runs")
    .select("finished_at, started_at")
    .eq("provider", "football-data")
    .eq("status", "success")
    .eq("sync_type", syncType)
    .order("finished_at", {
      ascending: false,
      nullsFirst: false,
    })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const syncRun = data as SyncRunRow | null;

  return syncRun?.finished_at ?? syncRun?.started_at ?? null;
}

async function getOfficialMatchStats(
  client: SupabaseAdminClient,
  now: Date,
): Promise<OfficialMatchStats> {
  const { data, error } = await client
    .from("matches")
    .select("football_data_id, kickoff_at, raw_json, status");

  if (error) {
    throw error;
  }

  const officialMatches = (data as MatchRow[]).filter(isOfficialFixture);
  const liveStats = getLiveWindowStats(officialMatches, now);

  return {
    ...liveStats,
    officialMatchesCount: officialMatches.length,
  };
}

function decideFixtureSync(
  mode: FootballDataCronMode,
  stats: OfficialMatchStats,
  lastSuccessAt: string | null,
  now: Date,
): SyncDecision<FootballDataFixtureSyncResult> {
  if (mode === "fixtures") {
    return {
      lastSuccessAt,
      reason: "Modo fixtures solicitado explícitamente.",
      run: true,
    };
  }

  if (mode === "results") {
    return {
      lastSuccessAt,
      reason: "Modo results solicitado: no se refrescan fixtures.",
      run: false,
    };
  }

  if (stats.officialMatchesCount === 0) {
    return {
      lastSuccessAt,
      reason: "No hay partidos oficiales Football-Data en la base local.",
      run: true,
    };
  }

  if (isOlderThan(lastSuccessAt, now, fixtureRefreshMs)) {
    return {
      lastSuccessAt,
      reason: "La última sync de fixtures superó el intervalo de 12 horas.",
      run: true,
    };
  }

  return {
    lastSuccessAt,
    reason: "Fixtures recientes: se evita una sync completa innecesaria.",
    run: false,
  };
}

function decideResultsSync(
  mode: FootballDataCronMode,
  stats: OfficialMatchStats,
  lastSuccessAt: string | null,
  now: Date,
): SyncDecision<FootballDataResultsSyncResult> {
  if (mode === "fixtures") {
    return {
      lastSuccessAt,
      reason: "Modo fixtures solicitado: no se refrescan resultados.",
      run: false,
    };
  }

  if (mode === "results") {
    return {
      lastSuccessAt,
      reason: "Modo results solicitado explícitamente.",
      run: true,
    };
  }

  if (stats.officialMatchesCount === 0) {
    return {
      lastSuccessAt,
      reason: "Sin fixtures oficiales no hay resultados que refrescar.",
      run: false,
    };
  }

  if (stats.liveStatusMatchesCount > 0 || stats.liveWindowMatchesCount > 0) {
    return {
      lastSuccessAt,
      reason:
        "Hay partidos en ventana live o con estado en juego; se refrescan resultados.",
      run: true,
    };
  }

  if (isOlderThan(lastSuccessAt, now, quietResultsRefreshMs)) {
    return {
      lastSuccessAt,
      reason:
        "No hay ventana live, pero la última sync de resultados superó 60 minutos.",
      run: true,
    };
  }

  return {
    lastSuccessAt,
    reason: "Sin ventana live y resultados recientes: se omite la llamada.",
    run: false,
  };
}

export async function runFootballDataSmartSync(
  mode: FootballDataCronMode = "smart",
): Promise<FootballDataSmartSyncSummary> {
  const startedAt = new Date();
  const client = createSupabaseAdminClient();
  let stats = await getOfficialMatchStats(client, startedAt);
  const lastFixtureSuccessAt = await getLatestSuccessfulSyncRun(
    client,
    "fixtures",
  );
  const fixtureDecision = decideFixtureSync(
    mode,
    stats,
    lastFixtureSuccessAt,
    startedAt,
  );
  let stoppedAfterFixtures = false;

  if (fixtureDecision.run) {
    fixtureDecision.result = await syncFootballDataFixtures({
      trigger: "cron",
    });

    if (mode !== "fixtures" && hasLowQuota(fixtureDecision.result)) {
      stoppedAfterFixtures = true;
    }

    if (mode === "smart") {
      stats = await getOfficialMatchStats(client, new Date());
    }
  }

  const lastResultsSuccessAt = await getLatestSuccessfulSyncRun(
    client,
    "results",
  );
  const resultsDecision = stoppedAfterFixtures
    ? ({
        lastSuccessAt: lastResultsSuccessAt,
        reason:
          "Cuota baja después de fixtures; se omite resultados para evitar 429.",
        run: false,
      } satisfies SyncDecision<FootballDataResultsSyncResult>)
    : decideResultsSync(mode, stats, lastResultsSuccessAt, new Date());

  if (resultsDecision.run) {
    resultsDecision.result = await syncFootballDataResults({
      trigger: "cron",
    });
  }

  return {
    finishedAt: new Date().toISOString(),
    fixtures: {
      ...fixtureDecision,
      officialMatchesCount: stats.officialMatchesCount,
    },
    mode,
    rateLimit: {
      stoppedAfterFixtures,
    },
    results: {
      ...resultsDecision,
      ...stats,
    },
    startedAt: startedAt.toISOString(),
  };
}

import type { Json } from "@/lib/supabase/database.types";
import type {
  FootballDataMatch,
  FootballDataMatchCandidate,
  FootballDataMatchScoreSide,
  FootballDataTeam,
  FootballDataTeamCandidate,
} from "@/lib/sports/football-data/types";

const allowedLocalStatuses = new Set([
  "CANCELLED",
  "FINISHED",
  "IN_PLAY",
  "PAUSED",
  "POSTPONED",
  "SCHEDULED",
  "TIMED",
]);

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

function normalizeText(value: string | null | undefined) {
  const normalized = value?.trim();

  return normalized && normalized.length > 0 ? normalized : null;
}

function getScoreSide(match: FootballDataMatch): FootballDataMatchScoreSide | null {
  return match.score?.fullTime ?? match.score?.regularTime ?? null;
}

function getWinner(match: FootballDataMatch): FootballDataMatchCandidate["winner"] {
  const winner = match.score?.winner ?? null;

  if (winner === "AWAY_TEAM" || winner === "DRAW" || winner === "HOME_TEAM") {
    return winner;
  }

  const score = getScoreSide(match);

  if (typeof score?.home !== "number" || typeof score.away !== "number") {
    return null;
  }

  if (score.home > score.away) {
    return "HOME_TEAM";
  }

  if (score.away > score.home) {
    return "AWAY_TEAM";
  }

  return "DRAW";
}

function mapStatus(status: string | null | undefined) {
  const normalized = normalizeText(status)?.toUpperCase() ?? "SCHEDULED";

  // Some Football-Data statuses require a future DB status migration. Until
  // that happens, preserve the raw payload and map them conservatively.
  if (allowedLocalStatuses.has(normalized)) {
    return normalized;
  }

  if (normalized === "SUSPENDED") {
    return "PAUSED";
  }

  if (normalized === "AWARDED") {
    return "FINISHED";
  }

  if (normalized === "EXTRA_TIME" || normalized === "PENALTY_SHOOTOUT") {
    return "IN_PLAY";
  }

  return "SCHEDULED";
}

export function mapFootballDataTeamToCandidate(
  team: FootballDataTeam,
): FootballDataTeamCandidate {
  const name = normalizeText(team.name) ?? `Equipo ${team.id}`;

  return {
    badge_url: normalizeText(team.crest),
    flag_url: normalizeText(team.area?.flag),
    football_data_id: team.id,
    name_en: name,
    // Spanish names need a curated alias table later. Until then, keep the
    // provider name as fallback and let UI/local edits override it.
    name_es: normalizeText(team.shortName) ?? name,
    raw_json: toJson(team),
    short_name: normalizeText(team.shortName),
    tla: normalizeText(team.tla),
  };
}

export function mapFootballDataMatchToCandidate(
  match: FootballDataMatch,
  syncedAt = new Date().toISOString(),
): FootballDataMatchCandidate {
  const score = getScoreSide(match);

  return {
    away_score: typeof score?.away === "number" ? score.away : null,
    away_team_football_data_id: match.awayTeam?.id ?? null,
    football_data_id: match.id,
    group_code: normalizeText(match.group),
    home_score: typeof score?.home === "number" ? score.home : null,
    home_team_football_data_id: match.homeTeam?.id ?? null,
    kickoff_at: new Date(match.utcDate).toISOString(),
    last_synced_at: syncedAt,
    match_number: match.matchday ?? null,
    raw_json: toJson(match),
    stage: normalizeText(match.stage),
    status: mapStatus(match.status),
    winner: getWinner(match),
  };
}

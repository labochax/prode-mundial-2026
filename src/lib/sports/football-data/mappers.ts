import type { Json } from "@/lib/supabase/database.types";
import type {
  FootballDataMatch,
  FootballDataMatchCandidate,
  FootballDataMatchScoreSide,
  FootballDataMatchStatus,
  FootballDataTeam,
  FootballDataTeamCandidate,
} from "@/lib/sports/football-data/types";

const allowedFootballDataStatuses = new Set<FootballDataMatchStatus>([
  "AWARDED",
  "CANCELLED",
  "EXTRA_TIME",
  "FINISHED",
  "IN_PLAY",
  "PAUSED",
  "PENALTY_SHOOTOUT",
  "POSTPONED",
  "SCHEDULED",
  "SUSPENDED",
  "TIMED",
]);

const spanishTeamNamesByKey: Record<string, string> = {
  argentina: "Argentina",
  australia: "Australia",
  belgium: "Bélgica",
  brazil: "Brasil",
  canada: "Canadá",
  chile: "Chile",
  colombia: "Colombia",
  croatia: "Croacia",
  denmark: "Dinamarca",
  ecuador: "Ecuador",
  england: "Inglaterra",
  france: "Francia",
  germany: "Alemania",
  italy: "Italia",
  japan: "Japón",
  mexico: "México",
  morocco: "Marruecos",
  netherlands: "Países Bajos",
  paraguay: "Paraguay",
  peru: "Perú",
  portugal: "Portugal",
  qatar: "Qatar",
  senegal: "Senegal",
  spain: "España",
  switzerland: "Suiza",
  uruguay: "Uruguay",
  usa: "Estados Unidos",
  "united states": "Estados Unidos",
};

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

function getWinner(
  match: FootballDataMatch,
  status: FootballDataMatchStatus,
): FootballDataMatchCandidate["winner"] {
  const winner = match.score?.winner ?? null;

  if (winner === "AWAY_TEAM" || winner === "DRAW" || winner === "HOME_TEAM") {
    return winner;
  }

  if (status !== "FINISHED" && status !== "AWARDED") {
    return null;
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

function mapStatus(status: string | null | undefined): FootballDataMatchStatus {
  const normalized = normalizeText(status)?.toUpperCase() ?? "SCHEDULED";

  if (allowedFootballDataStatuses.has(normalized as FootballDataMatchStatus)) {
    return normalized as FootballDataMatchStatus;
  }

  return "SCHEDULED";
}

function getSpanishTeamName(team: FootballDataTeam, fallback: string) {
  const candidates = [team.name, team.shortName, team.tla]
    .map((value) => normalizeText(value)?.toLowerCase())
    .filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    const mappedName = spanishTeamNamesByKey[candidate];

    if (mappedName) {
      return mappedName;
    }
  }

  return fallback;
}

export function mapFootballDataTeamToCandidate(
  team: FootballDataTeam,
): FootballDataTeamCandidate {
  const name = normalizeText(team.name) ?? `Equipo ${team.id}`;
  const shortName = normalizeText(team.shortName);

  return {
    badge_url: normalizeText(team.crest),
    flag_url: normalizeText(team.area?.flag),
    football_data_id: team.id,
    name_en: name,
    // This intentionally stays as a small alias table. A complete Spanish
    // naming policy belongs in a later data-quality pass.
    name_es: getSpanishTeamName(team, shortName ?? name),
    raw_json: toJson(team),
    short_name: shortName,
    tla: normalizeText(team.tla),
  };
}

export function mapFootballDataMatchToCandidate(
  match: FootballDataMatch,
  syncedAt = new Date().toISOString(),
): FootballDataMatchCandidate {
  const score = getScoreSide(match);
  const status = mapStatus(match.status);

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
    minute: typeof match.minute === "number" ? match.minute : null,
    raw_json: toJson(match),
    stage: normalizeText(match.stage),
    status,
    venue_name: normalizeText(match.venue),
    winner: getWinner(match, status),
  };
}

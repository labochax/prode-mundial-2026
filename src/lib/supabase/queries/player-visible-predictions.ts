import type { SupabaseClient } from "@supabase/supabase-js";

import { getMatchStageLabel } from "@/lib/matches/dashboard-stage";
import {
  comparePredictionMatchesChronologically,
  getPredictionResultMarker,
  isVisiblePlayerPredictionMatch,
  type VisiblePredictionMatch,
} from "@/lib/predictions/visible-prediction-results";
import type { Database } from "@/lib/supabase/database.types";

type SupabaseDatabaseClient = SupabaseClient<Database>;
type PredictionRow = Database["public"]["Tables"]["predictions"]["Row"];
type MatchRow = Database["public"]["Tables"]["matches"]["Row"];
type TeamRow = Pick<
  Database["public"]["Tables"]["teams"]["Row"],
  "id" | "name_en" | "name_es" | "short_name" | "tla"
>;

export type PlayerVisiblePredictionBadgeTone =
  | "closed"
  | "exact"
  | "miss"
  | "outcome";

export type PlayerVisiblePredictionBadge = {
  label: "Cerrado" | "Exacto +3" | "Fallado +0" | "Resultado +1";
  tone: PlayerVisiblePredictionBadgeTone;
};

export type PlayerVisiblePrediction = {
  awayScore: number;
  awayTeamCode: string;
  awayTeamName: string;
  badge: PlayerVisiblePredictionBadge;
  finalAwayScore: number | null;
  finalHomeScore: number | null;
  homeScore: number;
  homeTeamCode: string;
  homeTeamName: string;
  kickoffAt: string;
  matchId: string;
  matchNumber: number | null;
  predictionId: string;
  stageLabel: string;
};

export type PlayerVisiblePredictionMatchRow = VisiblePredictionMatch & Pick<
  MatchRow,
  | "away_score"
  | "away_team_id"
  | "group_code"
  | "home_score"
  | "home_team_id"
  | "id"
  | "kickoff_at"
  | "lock_at"
  | "match_number"
  | "stage"
  | "status"
> & {
  away_team: TeamRow | null;
  home_team: TeamRow | null;
};

export type PlayerVisiblePredictionRow = Pick<
  PredictionRow,
  | "id"
  | "points"
  | "predicted_away_score"
  | "predicted_home_score"
> & {
  matches: PlayerVisiblePredictionMatchRow | null;
};

const playerVisiblePredictionSelect = `
  id,
  points,
  predicted_away_score,
  predicted_home_score,
  matches!inner(
    away_score,
    away_team_id,
    group_code,
    home_score,
    home_team_id,
    id,
    kickoff_at,
    lock_at,
    match_number,
    stage,
    status,
    home_team:teams!matches_home_team_id_fkey(id,name_en,name_es,short_name,tla),
    away_team:teams!matches_away_team_id_fkey(id,name_en,name_es,short_name,tla)
  )
`;

export function getPlayerVisiblePredictionBadge(
  points: number | null,
): PlayerVisiblePredictionBadge {
  const marker = getPredictionResultMarker(points);

  if (marker === "exact") {
    return {
      label: "Exacto +3",
      tone: "exact",
    };
  }

  if (marker === "outcome") {
    return {
      label: "Resultado +1",
      tone: "outcome",
    };
  }

  if (marker === "miss") {
    return {
      label: "Fallado +0",
      tone: "miss",
    };
  }

  return {
    label: "Cerrado",
    tone: "closed",
  };
}

export function isPlayerMatchPredictionVisible(
  match: Pick<
    PlayerVisiblePredictionMatchRow,
    "away_team_id" | "home_team_id" | "lock_at" | "status"
  >,
  now = new Date(),
) {
  return isVisiblePlayerPredictionMatch(match, now);
}

function getTeamName(team: TeamRow | null, fallback: string) {
  return team?.name_es ?? team?.name_en ?? fallback;
}

function getTeamCode(team: TeamRow | null, fallback: string) {
  return (team?.tla ?? team?.short_name ?? fallback).slice(0, 3).toUpperCase();
}

export function buildPlayerVisiblePredictions(
  rows: PlayerVisiblePredictionRow[],
  now = new Date(),
) {
  return rows
    .filter((row) => {
      if (!row.matches) {
        return false;
      }

      return isPlayerMatchPredictionVisible(row.matches, now);
    })
    .sort((left, right) =>
      comparePredictionMatchesChronologically(left.matches!, right.matches!),
    )
    .map((row): PlayerVisiblePrediction => {
      const match = row.matches as PlayerVisiblePredictionMatchRow;

      return {
        awayScore: row.predicted_away_score,
        awayTeamCode: getTeamCode(match.away_team, "VIS"),
        awayTeamName: getTeamName(match.away_team, "Visitante"),
        badge: getPlayerVisiblePredictionBadge(row.points),
        finalAwayScore: match.away_score,
        finalHomeScore: match.home_score,
        homeScore: row.predicted_home_score,
        homeTeamCode: getTeamCode(match.home_team, "LOC"),
        homeTeamName: getTeamName(match.home_team, "Local"),
        kickoffAt: match.kickoff_at,
        matchId: match.id,
        matchNumber: match.match_number,
        predictionId: row.id,
        stageLabel: getMatchStageLabel(match),
      };
    });
}

export async function getPlayerVisiblePredictions(
  client: SupabaseDatabaseClient,
  poolId: string,
  userId: string,
) {
  const { data, error } = await client
    .from("predictions")
    .select(playerVisiblePredictionSelect)
    .eq("pool_id", poolId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return buildPlayerVisiblePredictions(
    (data ?? []) as PlayerVisiblePredictionRow[],
  );
}

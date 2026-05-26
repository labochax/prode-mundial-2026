import type { MatchWithRelations } from "@/lib/matches/prediction-match";
import type { PredictionRow } from "@/lib/supabase/queries/predictions";
import { buildProjectedBracket } from "@/lib/tournament/bracket";
import { rankThirdPlacedTeams } from "@/lib/tournament/rank-third-placed";
import { simulateGroupTables } from "@/lib/tournament/simulate-groups";
import type { TournamentGroupMatch, TournamentTeam } from "@/lib/tournament/types";

export function isGroupStageMatch(match: MatchWithRelations) {
  return (match.stage ?? "").toUpperCase().includes("GROUP");
}

function mapTeam(
  team: MatchWithRelations["home_team"],
  fallbackId: string,
): TournamentTeam {
  return {
    badgeUrl: team?.badge_url ?? team?.logo_url ?? null,
    code: team?.tla ?? team?.short_name ?? null,
    id: team?.id ?? fallbackId,
    name: team?.name_es ?? team?.name_en ?? "Equipo a confirmar",
  };
}

export function getGroupStagePredictionMatches(
  matches: MatchWithRelations[],
  predictionsByMatchId: Map<string, PredictionRow>,
): TournamentGroupMatch[] {
  return matches.filter(isGroupStageMatch).map((match) => {
    const prediction = predictionsByMatchId.get(match.id) ?? null;

    return {
      awayTeam: mapTeam(match.away_team, `${match.id}-away`),
      groupCode: match.group_code ?? "GROUP",
      homeTeam: mapTeam(match.home_team, `${match.id}-home`),
      id: match.id,
      prediction: prediction
        ? {
            awayScore: prediction.predicted_away_score,
            homeScore: prediction.predicted_home_score,
          }
        : null,
    };
  });
}

export function buildTournamentProjection(
  matches: MatchWithRelations[],
  predictionsByMatchId: Map<string, PredictionRow>,
) {
  const groupMatches = matches.filter(isGroupStageMatch);
  const simulationMatches = getGroupStagePredictionMatches(
    groupMatches,
    predictionsByMatchId,
  );
  const groups = simulateGroupTables(simulationMatches);
  const thirdPlacedTeams = rankThirdPlacedTeams(groups);
  const projectedBracket = buildProjectedBracket(groups, thirdPlacedTeams);

  return {
    groupMatches,
    groups,
    projectedBracket,
    thirdPlacedTeams,
  };
}

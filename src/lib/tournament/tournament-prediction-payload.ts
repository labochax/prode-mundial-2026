import {
  buildDerivedKnockoutRounds,
  type DerivedKnockoutMatch,
  type KnockoutSelectionMap,
} from "@/lib/tournament/knockout-selection";
import type {
  ProjectedBracket,
  ProjectedBracketMatch,
  ProjectedBracketSlot,
} from "@/lib/tournament/types";

export type SavedTournamentBracketSlot = {
  groupCode: string | null;
  originLabel: string;
  qualificationType: string;
  ruleLabel?: string;
  slotLabel: string;
  sourceRank: number | null;
  team: {
    code: string | null;
    id: string;
    name: string;
  };
};

export type SavedTournamentBracketMatch = {
  away: SavedTournamentBracketSlot;
  home: SavedTournamentBracketSlot;
  id: string;
  matchNumber: number;
  roundLabel: string;
  selectedTeamId: string | null;
  slotLabel: string;
};

export type SavedTournamentBracketJson = {
  projectedRoundOf32: SavedTournamentBracketMatch[];
  rounds: {
    final: SavedTournamentBracketMatch[];
    quarterfinals: SavedTournamentBracketMatch[];
    roundOf16: SavedTournamentBracketMatch[];
    semifinals: SavedTournamentBracketMatch[];
    thirdPlace: SavedTournamentBracketMatch[];
  };
  selections: KnockoutSelectionMap;
  summary: {
    championTeamId: string;
    fourthPlaceTeamId: string;
    runnerUpTeamId: string;
    thirdPlaceTeamId: string;
  };
  thirdPlaceCombination: ProjectedBracket["thirdPlaceCombination"];
  version: 1;
};

export type TournamentPredictionPayload = {
  bracket_json: SavedTournamentBracketJson;
  champion_team_id: string;
  fourth_place_team_id: string;
  quarterfinal_team_ids: string[];
  round_of_16_team_ids: string[];
  runner_up_team_id: string;
  semifinal_team_ids: string[];
  third_place_team_id: string;
};

export type TournamentPredictionPayloadResult =
  | {
      payload: TournamentPredictionPayload;
      status: "success";
    }
  | {
      message: "Completá la llave antes de guardar";
      status: "error";
    };

function cloneSelections(selections: KnockoutSelectionMap): KnockoutSelectionMap {
  return Object.fromEntries(
    Object.entries(selections).filter(
      (entry): entry is [string, string] =>
        typeof entry[0] === "string" && typeof entry[1] === "string",
    ),
  );
}

function serializeSlot(slot: ProjectedBracketSlot): SavedTournamentBracketSlot {
  return {
    groupCode: slot.groupCode,
    originLabel: slot.originLabel,
    qualificationType: slot.qualificationType,
    ruleLabel: slot.ruleLabel,
    slotLabel: slot.slotLabel,
    sourceRank: slot.sourceRank,
    team: {
      code: slot.team.code,
      id: slot.team.id,
      name: slot.team.name,
    },
  };
}

function serializeMatch(
  matchup: DerivedKnockoutMatch | ProjectedBracketMatch,
  selections: KnockoutSelectionMap,
): SavedTournamentBracketMatch {
  return {
    away: serializeSlot(matchup.away),
    home: serializeSlot(matchup.home),
    id: matchup.id,
    matchNumber: matchup.matchNumber,
    roundLabel: matchup.roundLabel,
    selectedTeamId: selections[matchup.id] ?? null,
    slotLabel: matchup.slotLabel,
  };
}

function getSelectedSlot(
  matchup: Pick<ProjectedBracketMatch, "away" | "home" | "id">,
  selections: KnockoutSelectionMap,
) {
  const selectedTeamId = selections[matchup.id];

  if (!selectedTeamId) {
    return null;
  }

  if (matchup.home.team.id === selectedTeamId && !matchup.home.isPlaceholder) {
    return matchup.home;
  }

  if (matchup.away.team.id === selectedTeamId && !matchup.away.isPlaceholder) {
    return matchup.away;
  }

  return null;
}

function collectWinnerTeamIds(
  matches: Pick<ProjectedBracketMatch, "away" | "home" | "id">[],
  selections: KnockoutSelectionMap,
) {
  const winners = matches.map((matchup) => getSelectedSlot(matchup, selections));

  return winners.every(Boolean)
    ? (winners as ProjectedBracketSlot[]).map((slot) => slot.team.id)
    : null;
}

function hasDistinctPlacements(teamIds: string[]) {
  return new Set(teamIds).size === teamIds.length;
}

function isCompletePayloadShape(
  roundOf16TeamIds: string[] | null,
  quarterfinalTeamIds: string[] | null,
  semifinalTeamIds: string[] | null,
  placements: string[],
) {
  return (
    roundOf16TeamIds?.length === 16 &&
    quarterfinalTeamIds?.length === 8 &&
    semifinalTeamIds?.length === 4 &&
    placements.every(Boolean) &&
    hasDistinctPlacements(placements)
  );
}

export function buildTournamentPredictionPayload(
  bracket: ProjectedBracket,
  selections: KnockoutSelectionMap,
): TournamentPredictionPayloadResult {
  if (bracket.status !== "complete") {
    return {
      message: "Completá la llave antes de guardar",
      status: "error",
    };
  }

  const safeSelections = cloneSelections(selections);
  const rounds = buildDerivedKnockoutRounds(bracket.roundOf32, safeSelections);
  const roundOf16TeamIds = collectWinnerTeamIds(
    rounds.roundOf32,
    safeSelections,
  );
  const quarterfinalTeamIds = collectWinnerTeamIds(
    rounds.roundOf16,
    safeSelections,
  );
  const semifinalTeamIds = collectWinnerTeamIds(
    rounds.quarterfinals,
    safeSelections,
  );
  const championTeamId = rounds.summary.champion?.team.id ?? "";
  const runnerUpTeamId = rounds.summary.runnerUp?.team.id ?? "";
  const thirdPlaceTeamId = rounds.summary.thirdPlace?.team.id ?? "";
  const fourthPlaceTeamId = rounds.summary.fourthPlace?.team.id ?? "";
  const placements = [
    championTeamId,
    runnerUpTeamId,
    thirdPlaceTeamId,
    fourthPlaceTeamId,
  ];

  if (
    !roundOf16TeamIds ||
    !quarterfinalTeamIds ||
    !semifinalTeamIds ||
    !isCompletePayloadShape(
      roundOf16TeamIds,
      quarterfinalTeamIds,
      semifinalTeamIds,
      placements,
    )
  ) {
    return {
      message: "Completá la llave antes de guardar",
      status: "error",
    };
  }

  const completeRoundOf16TeamIds = roundOf16TeamIds;
  const completeQuarterfinalTeamIds = quarterfinalTeamIds;
  const completeSemifinalTeamIds = semifinalTeamIds;

  return {
    payload: {
      bracket_json: {
        projectedRoundOf32: bracket.roundOf32.map((matchup) =>
          serializeMatch(matchup, safeSelections),
        ),
        rounds: {
          final: rounds.final.map((matchup) =>
            serializeMatch(matchup, safeSelections),
          ),
          quarterfinals: rounds.quarterfinals.map((matchup) =>
            serializeMatch(matchup, safeSelections),
          ),
          roundOf16: rounds.roundOf16.map((matchup) =>
            serializeMatch(matchup, safeSelections),
          ),
          semifinals: rounds.semifinals.map((matchup) =>
            serializeMatch(matchup, safeSelections),
          ),
          thirdPlace: rounds.thirdPlace.map((matchup) =>
            serializeMatch(matchup, safeSelections),
          ),
        },
        selections: safeSelections,
        summary: {
          championTeamId,
          fourthPlaceTeamId,
          runnerUpTeamId,
          thirdPlaceTeamId,
        },
        thirdPlaceCombination: bracket.thirdPlaceCombination,
        version: 1,
      },
      champion_team_id: championTeamId,
      fourth_place_team_id: fourthPlaceTeamId,
      quarterfinal_team_ids: completeQuarterfinalTeamIds,
      round_of_16_team_ids: completeRoundOf16TeamIds,
      runner_up_team_id: runnerUpTeamId,
      semifinal_team_ids: completeSemifinalTeamIds,
      third_place_team_id: thirdPlaceTeamId,
    },
    status: "success",
  };
}

export function getSelectionsFromSavedTournamentPrediction(
  bracketJson: unknown,
): KnockoutSelectionMap {
  if (
    typeof bracketJson !== "object" ||
    bracketJson === null ||
    !("selections" in bracketJson)
  ) {
    return {};
  }

  const selections = bracketJson.selections;

  if (typeof selections !== "object" || selections === null) {
    return {};
  }

  return cloneSelections(selections as KnockoutSelectionMap);
}

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getOfficialRoundOf32MatchNumberForFootballDataId,
  OFFICIAL_ROUND_OF_32_FIXTURE_MAP,
  type OfficialKnockoutFixtureMapEntry,
} from "@/lib/tournament/official-knockout-fixture-map";
import type { FifaAnnexCSlot } from "@/lib/tournament/third-place-combinations";
import { findFifaAnnexCCombination } from "@/lib/tournament/third-place-combinations";
import type { Database } from "@/lib/supabase/database.types";

type SupabaseDatabaseClient = SupabaseClient<Database>;
type MatchUpdate = Database["public"]["Tables"]["matches"]["Update"];

export type OfficialKnockoutResolverMatch = {
  away_score: number | null;
  away_team_id: string | null;
  football_data_id: number | null;
  group_code: string | null;
  home_score: number | null;
  home_team_id: string | null;
  id: string;
  kickoff_at: string | null;
  match_number: number | null;
  stage: string | null;
  status: string | null;
};

type OfficialGroupStandingRow = {
  draws: number;
  goalDifference: number;
  goalsAgainst: number;
  goalsFor: number;
  losses: number;
  played: number;
  points: number;
  teamId: string;
  wins: number;
};

type OfficialGroupResolution = {
  isComplete: boolean;
  rows: Array<OfficialGroupStandingRow & { isAmbiguous: boolean; rank: number }>;
};

type DirectSlotSpec = {
  groupCode: string;
  rank: 1 | 2;
  type: "direct";
};

type BestThirdSlotSpec = {
  fifaSlot: FifaAnnexCSlot;
  type: "best-third";
};

type RoundOf32SlotSpec = DirectSlotSpec | BestThirdSlotSpec;

type RoundOf32MatchSpec = {
  away: RoundOf32SlotSpec;
  home: RoundOf32SlotSpec;
  matchNumber: number;
};

export type OfficialRoundOf32Assignment = {
  awayTeamId?: string;
  homeTeamId?: string;
  matchNumber: number;
};

export type OfficialKnockoutTeamSyncStats = {
  knockoutMatchesUnlocked: number;
  knockoutSkippedMissingOfficialFixtureMap: number;
  knockoutTeamSlotsResolved: number;
  knockoutTeamSlotsSkipped: number;
};

export type OfficialKnockoutTeamUpdate = Pick<
  MatchUpdate,
  "away_team_id" | "home_team_id"
> & {
  id: string;
};

export type OfficialKnockoutTeamUpdatePlanOptions = {
  fixtureMap?: readonly OfficialKnockoutFixtureMapEntry[];
};

const GROUP_MATCHES_PER_GROUP = 6;
const REQUIRED_GROUP_COUNT = 12;
const ROUND_OF_32_MATCH_NUMBERS = range(73, 88);

const FIFA_ROUND_OF_32_MATCHES: RoundOf32MatchSpec[] = [
  {
    away: { groupCode: "B", rank: 2, type: "direct" },
    home: { groupCode: "A", rank: 2, type: "direct" },
    matchNumber: 73,
  },
  {
    away: { fifaSlot: "1E", type: "best-third" },
    home: { groupCode: "E", rank: 1, type: "direct" },
    matchNumber: 74,
  },
  {
    away: { groupCode: "C", rank: 2, type: "direct" },
    home: { groupCode: "F", rank: 1, type: "direct" },
    matchNumber: 75,
  },
  {
    away: { groupCode: "F", rank: 2, type: "direct" },
    home: { groupCode: "C", rank: 1, type: "direct" },
    matchNumber: 76,
  },
  {
    away: { fifaSlot: "1I", type: "best-third" },
    home: { groupCode: "I", rank: 1, type: "direct" },
    matchNumber: 77,
  },
  {
    away: { groupCode: "I", rank: 2, type: "direct" },
    home: { groupCode: "E", rank: 2, type: "direct" },
    matchNumber: 78,
  },
  {
    away: { fifaSlot: "1A", type: "best-third" },
    home: { groupCode: "A", rank: 1, type: "direct" },
    matchNumber: 79,
  },
  {
    away: { fifaSlot: "1L", type: "best-third" },
    home: { groupCode: "L", rank: 1, type: "direct" },
    matchNumber: 80,
  },
  {
    away: { fifaSlot: "1D", type: "best-third" },
    home: { groupCode: "D", rank: 1, type: "direct" },
    matchNumber: 81,
  },
  {
    away: { fifaSlot: "1G", type: "best-third" },
    home: { groupCode: "G", rank: 1, type: "direct" },
    matchNumber: 82,
  },
  {
    away: { groupCode: "L", rank: 2, type: "direct" },
    home: { groupCode: "K", rank: 2, type: "direct" },
    matchNumber: 83,
  },
  {
    away: { groupCode: "J", rank: 2, type: "direct" },
    home: { groupCode: "H", rank: 1, type: "direct" },
    matchNumber: 84,
  },
  {
    away: { fifaSlot: "1B", type: "best-third" },
    home: { groupCode: "B", rank: 1, type: "direct" },
    matchNumber: 85,
  },
  {
    away: { groupCode: "H", rank: 2, type: "direct" },
    home: { groupCode: "J", rank: 1, type: "direct" },
    matchNumber: 86,
  },
  {
    away: { fifaSlot: "1K", type: "best-third" },
    home: { groupCode: "K", rank: 1, type: "direct" },
    matchNumber: 87,
  },
  {
    away: { groupCode: "G", rank: 2, type: "direct" },
    home: { groupCode: "D", rank: 2, type: "direct" },
    matchNumber: 88,
  },
];

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function normalizeGroupCode(value: string | null) {
  return (value ?? "")
    .trim()
    .toUpperCase()
    .replace(/^GROUP_/, "")
    .replace(/^GRUPO_/, "")
    .replace(/^GR_/, "");
}

function normalizeStage(value: string | null) {
  return (value ?? "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function isRoundOf32Match(match: OfficialKnockoutResolverMatch) {
  if (
    typeof match.match_number === "number" &&
    ROUND_OF_32_MATCH_NUMBERS.includes(match.match_number)
  ) {
    return true;
  }

  const stage = normalizeStage(match.stage);

  return (
    stage.includes("LAST_32") ||
    stage.includes("ROUND_OF_32") ||
    stage.includes("ROUND_32") ||
    stage.includes("16AVOS")
  );
}

function isFinishedGroupMatch(match: OfficialKnockoutResolverMatch) {
  return (
    normalizeGroupCode(match.group_code) &&
    match.status?.trim().toUpperCase() === "FINISHED" &&
    typeof match.home_score === "number" &&
    typeof match.away_score === "number" &&
    Boolean(match.home_team_id && match.away_team_id)
  );
}

function createStandingRow(teamId: string): OfficialGroupStandingRow {
  return {
    draws: 0,
    goalDifference: 0,
    goalsAgainst: 0,
    goalsFor: 0,
    losses: 0,
    played: 0,
    points: 0,
    teamId,
    wins: 0,
  };
}

function getOrCreateStandingRow(
  rowsByTeamId: Map<string, OfficialGroupStandingRow>,
  teamId: string,
) {
  const current = rowsByTeamId.get(teamId);

  if (current) {
    return current;
  }

  const next = createStandingRow(teamId);
  rowsByTeamId.set(teamId, next);

  return next;
}

function applyScore(
  row: OfficialGroupStandingRow,
  goalsFor: number,
  goalsAgainst: number,
) {
  row.played += 1;
  row.goalsFor += goalsFor;
  row.goalsAgainst += goalsAgainst;
  row.goalDifference = row.goalsFor - row.goalsAgainst;

  if (goalsFor > goalsAgainst) {
    row.wins += 1;
    row.points += 3;
    return;
  }

  if (goalsFor === goalsAgainst) {
    row.draws += 1;
    row.points += 1;
    return;
  }

  row.losses += 1;
}

function compareStandingRows(
  left: OfficialGroupStandingRow,
  right: OfficialGroupStandingRow,
) {
  return (
    right.points - left.points ||
    right.goalDifference - left.goalDifference ||
    right.goalsFor - left.goalsFor ||
    left.teamId.localeCompare(right.teamId)
  );
}

function hasSameAvailableTieBreakers(
  left: OfficialGroupStandingRow,
  right: OfficialGroupStandingRow,
) {
  return (
    left.points === right.points &&
    left.goalDifference === right.goalDifference &&
    left.goalsFor === right.goalsFor
  );
}

function hasAmbiguousRank(
  rows: OfficialGroupStandingRow[],
  index: number,
) {
  const row = rows[index];
  const previous = rows[index - 1];
  const next = rows[index + 1];

  return Boolean(
    (previous && hasSameAvailableTieBreakers(row, previous)) ||
      (next && hasSameAvailableTieBreakers(row, next)),
  );
}

function buildGroupResolution(
  groupMatches: OfficialKnockoutResolverMatch[],
): OfficialGroupResolution {
  if (
    groupMatches.length !== GROUP_MATCHES_PER_GROUP ||
    groupMatches.some((match) => !isFinishedGroupMatch(match))
  ) {
    return {
      isComplete: false,
      rows: [],
    };
  }

  const rowsByTeamId = new Map<string, OfficialGroupStandingRow>();

  for (const match of groupMatches) {
    const homeTeamId = match.home_team_id!;
    const awayTeamId = match.away_team_id!;
    const homeRow = getOrCreateStandingRow(rowsByTeamId, homeTeamId);
    const awayRow = getOrCreateStandingRow(rowsByTeamId, awayTeamId);

    applyScore(homeRow, match.home_score!, match.away_score!);
    applyScore(awayRow, match.away_score!, match.home_score!);
  }

  const sortedRows = [...rowsByTeamId.values()].sort(compareStandingRows);

  return {
    isComplete: sortedRows.length === 4,
    rows: sortedRows.map((row, index) => ({
      ...row,
      isAmbiguous: hasAmbiguousRank(sortedRows, index),
      rank: index + 1,
    })),
  };
}

function getGroupResolutions(matches: OfficialKnockoutResolverMatch[]) {
  const matchesByGroupCode = new Map<string, OfficialKnockoutResolverMatch[]>();

  for (const match of matches) {
    const groupCode = normalizeGroupCode(match.group_code);

    if (!groupCode) {
      continue;
    }

    const groupMatches = matchesByGroupCode.get(groupCode) ?? [];
    groupMatches.push(match);
    matchesByGroupCode.set(groupCode, groupMatches);
  }

  return new Map(
    [...matchesByGroupCode.entries()].map(([groupCode, groupMatches]) => [
      groupCode,
      buildGroupResolution(groupMatches),
    ]),
  );
}

function getDirectTeamId(
  spec: DirectSlotSpec,
  groupsByCode: Map<string, OfficialGroupResolution>,
) {
  const group = groupsByCode.get(spec.groupCode);
  const row = group?.rows[spec.rank - 1];

  if (!group?.isComplete || !row || row.isAmbiguous) {
    return null;
  }

  return row.teamId;
}

function getThirdPlacedTeamRows(
  groupsByCode: Map<string, OfficialGroupResolution>,
) {
  if (groupsByCode.size < REQUIRED_GROUP_COUNT) {
    return null;
  }

  const candidates = [...groupsByCode.entries()]
    .map(([groupCode, group]) => {
      const row = group.rows[2];

      return group.isComplete && row && !row.isAmbiguous
        ? { ...row, groupCode }
        : null;
    })
    .filter((row): row is OfficialGroupStandingRow & {
      groupCode: string;
      isAmbiguous: boolean;
      rank: number;
    } => Boolean(row));

  if (candidates.length !== REQUIRED_GROUP_COUNT) {
    return null;
  }

  const sortedCandidates = candidates.sort((left, right) => {
    return (
      compareStandingRows(left, right) ||
      left.groupCode.localeCompare(right.groupCode, "es-AR")
    );
  });
  const boundaryQualified = sortedCandidates[7];
  const boundaryEliminated = sortedCandidates[8];

  if (
    boundaryQualified &&
    boundaryEliminated &&
    hasSameAvailableTieBreakers(boundaryQualified, boundaryEliminated)
  ) {
    return null;
  }

  return sortedCandidates.slice(0, 8);
}

function getBestThirdTeamIdsByFifaSlot(
  groupsByCode: Map<string, OfficialGroupResolution>,
) {
  const thirdPlacedRows = getThirdPlacedTeamRows(groupsByCode);

  if (!thirdPlacedRows) {
    return null;
  }

  const combination = findFifaAnnexCCombination(
    thirdPlacedRows.map((row) => row.groupCode),
  );

  if (!combination) {
    return null;
  }

  const thirdTeamIdByGroupCode = new Map(
    thirdPlacedRows.map((row) => [row.groupCode, row.teamId] as const),
  );

  return {
    combination,
    teamIdsByFifaSlot: new Map(
      Object.entries(combination.slots).map(([slot, groupCode]) => [
        slot as FifaAnnexCSlot,
        thirdTeamIdByGroupCode.get(groupCode) ?? null,
      ]),
    ),
  };
}

function resolveSlot(
  spec: RoundOf32SlotSpec,
  groupsByCode: Map<string, OfficialGroupResolution>,
  bestThirds:
    | ReturnType<typeof getBestThirdTeamIdsByFifaSlot>
    | null,
) {
  if (spec.type === "direct") {
    return getDirectTeamId(spec, groupsByCode);
  }

  return bestThirds?.teamIdsByFifaSlot.get(spec.fifaSlot) ?? null;
}

export function resolveOfficialRoundOf32Assignments(
  matches: OfficialKnockoutResolverMatch[],
) {
  const groupsByCode = getGroupResolutions(matches);
  const bestThirds = getBestThirdTeamIdsByFifaSlot(groupsByCode);
  const unresolvedSlots: Array<{
    matchNumber: number;
    side: "away" | "home";
  }> = [];
  const assignmentsByMatchNumber = new Map<
    number,
    OfficialRoundOf32Assignment
  >();

  for (const matchSpec of FIFA_ROUND_OF_32_MATCHES) {
    const homeTeamId = resolveSlot(matchSpec.home, groupsByCode, bestThirds);
    const awayTeamId = resolveSlot(matchSpec.away, groupsByCode, bestThirds);
    const assignment: OfficialRoundOf32Assignment = {
      matchNumber: matchSpec.matchNumber,
    };

    if (homeTeamId) {
      assignment.homeTeamId = homeTeamId;
    } else {
      unresolvedSlots.push({
        matchNumber: matchSpec.matchNumber,
        side: "home",
      });
    }

    if (awayTeamId) {
      assignment.awayTeamId = awayTeamId;
    } else {
      unresolvedSlots.push({
        matchNumber: matchSpec.matchNumber,
        side: "away",
      });
    }

    assignmentsByMatchNumber.set(matchSpec.matchNumber, assignment);
  }

  return {
    assignmentsByMatchNumber,
    thirdPlaceCombination: bestThirds?.combination ?? null,
    unresolvedSlots,
  };
}

function getRoundOf32MatchesByNumber(
  matches: OfficialKnockoutResolverMatch[],
  fixtureMap: readonly OfficialKnockoutFixtureMapEntry[],
) {
  const matchesByNumber = new Map<number, OfficialKnockoutResolverMatch>();
  let skippedMissingOfficialFixtureMap = 0;

  for (const match of matches.filter(isRoundOf32Match)) {
    const matchNumber = getOfficialRoundOf32MatchNumberForFootballDataId(
      match.football_data_id,
      fixtureMap,
    );

    if (!matchNumber || !ROUND_OF_32_MATCH_NUMBERS.includes(matchNumber)) {
      skippedMissingOfficialFixtureMap += 1;
      continue;
    }

    if (matchesByNumber.has(matchNumber)) {
      skippedMissingOfficialFixtureMap += 1;
      continue;
    }

    matchesByNumber.set(matchNumber, match);
  }

  return {
    matchesByNumber,
    skippedMissingOfficialFixtureMap,
  };
}

function getSideUpdate(
  existingTeamId: string | null,
  resolvedTeamId: string | undefined,
) {
  if (!resolvedTeamId) {
    return {
      shouldSkip: true,
      value: null,
    };
  }

  if (!existingTeamId) {
    return {
      shouldSkip: false,
      value: resolvedTeamId,
    };
  }

  return {
    shouldSkip: existingTeamId !== resolvedTeamId,
    value: null,
  };
}

function getExistingRoundOf32TeamMatchIds(
  matches: OfficialKnockoutResolverMatch[],
) {
  const teamMatchIds = new Map<string, string>();

  for (const match of matches.filter(isRoundOf32Match)) {
    for (const teamId of [match.home_team_id, match.away_team_id]) {
      if (teamId && !teamMatchIds.has(teamId)) {
        teamMatchIds.set(teamId, match.id);
      }
    }
  }

  return teamMatchIds;
}

export function buildOfficialKnockoutTeamUpdatePlan(
  matches: OfficialKnockoutResolverMatch[],
  options: OfficialKnockoutTeamUpdatePlanOptions = {},
) {
  const { assignmentsByMatchNumber, unresolvedSlots } =
    resolveOfficialRoundOf32Assignments(matches);
  const {
    matchesByNumber: roundOf32MatchesByNumber,
    skippedMissingOfficialFixtureMap,
  } = getRoundOf32MatchesByNumber(
    matches,
    options.fixtureMap ?? OFFICIAL_ROUND_OF_32_FIXTURE_MAP,
  );
  const updates: OfficialKnockoutTeamUpdate[] = [];
  const plannedTeamMatchIds = getExistingRoundOf32TeamMatchIds(matches);
  const stats: OfficialKnockoutTeamSyncStats = {
    knockoutMatchesUnlocked: 0,
    knockoutSkippedMissingOfficialFixtureMap:
      skippedMissingOfficialFixtureMap,
    knockoutTeamSlotsResolved: 0,
    knockoutTeamSlotsSkipped: unresolvedSlots.length,
  };

  for (const matchNumber of ROUND_OF_32_MATCH_NUMBERS) {
    const match = roundOf32MatchesByNumber.get(matchNumber);
    const assignment = assignmentsByMatchNumber.get(matchNumber);

    if (!match || !assignment) {
      continue;
    }

    const home = getSideUpdate(match.home_team_id, assignment.homeTeamId);
    const away = getSideUpdate(match.away_team_id, assignment.awayTeamId);
    const update: OfficialKnockoutTeamUpdate = {
      id: match.id,
    };

    if (home.value) {
      const assignedMatchId = plannedTeamMatchIds.get(home.value);

      if (assignedMatchId && assignedMatchId !== match.id) {
        stats.knockoutTeamSlotsSkipped += 1;
      } else {
        plannedTeamMatchIds.set(home.value, match.id);
        update.home_team_id = home.value;
        stats.knockoutTeamSlotsResolved += 1;
      }
    } else if (home.shouldSkip && assignment.homeTeamId) {
      stats.knockoutTeamSlotsSkipped += 1;
    }

    if (away.value) {
      const assignedMatchId = plannedTeamMatchIds.get(away.value);

      if (assignedMatchId && assignedMatchId !== match.id) {
        stats.knockoutTeamSlotsSkipped += 1;
      } else {
        plannedTeamMatchIds.set(away.value, match.id);
        update.away_team_id = away.value;
        stats.knockoutTeamSlotsResolved += 1;
      }
    } else if (away.shouldSkip && assignment.awayTeamId) {
      stats.knockoutTeamSlotsSkipped += 1;
    }

    if (update.home_team_id || update.away_team_id) {
      const hadBothTeams = Boolean(match.home_team_id && match.away_team_id);
      const hasConflict = Boolean(
        (match.home_team_id &&
          assignment.homeTeamId &&
          match.home_team_id !== assignment.homeTeamId) ||
          (match.away_team_id &&
            assignment.awayTeamId &&
            match.away_team_id !== assignment.awayTeamId),
      );
      const willHaveBothTeams = Boolean(
        (match.home_team_id ?? update.home_team_id) &&
          (match.away_team_id ?? update.away_team_id),
      );

      if (!hasConflict && !hadBothTeams && willHaveBothTeams) {
        stats.knockoutMatchesUnlocked += 1;
      }

      updates.push(update);
    }
  }

  return {
    stats,
    updates,
  };
}

export async function syncOfficialKnockoutTeamsFromGroupResults(
  client: SupabaseDatabaseClient,
): Promise<OfficialKnockoutTeamSyncStats> {
  const { data, error } = await client
    .from("matches")
    .select(
      "id,match_number,football_data_id,group_code,stage,kickoff_at,status,home_score,away_score,home_team_id,away_team_id",
    )
    .not("football_data_id", "is", null);

  if (error) {
    throw error;
  }

  const plan = buildOfficialKnockoutTeamUpdatePlan(
    (data ?? []) as OfficialKnockoutResolverMatch[],
  );

  for (const update of plan.updates) {
    const { id, ...matchUpdate } = update;
    const { error: updateError } = await client
      .from("matches")
      .update(matchUpdate)
      .eq("id", id);

    if (updateError) {
      throw updateError;
    }
  }

  return plan.stats;
}

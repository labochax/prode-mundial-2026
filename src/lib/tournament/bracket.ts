import type {
  ProjectedBracket,
  ProjectedBracketMatch,
  ProjectedBracketSlot,
  ProjectedPlaceholderSlot,
  ProjectedQualifier,
  RankedThirdPlacedTeam,
  TournamentGroupSimulation,
  TournamentStandingRow,
} from "@/lib/tournament/types";
import {
  type FifaAnnexCCombination,
  type FifaAnnexCSlot,
  findFifaAnnexCCombination,
} from "@/lib/tournament/third-place-combinations";

const REQUIRED_GROUPS = 12;
const REQUIRED_DIRECT_QUALIFIERS = 24;
const REQUIRED_THIRD_PLACE_QUALIFIERS = 8;
const REQUIRED_TOTAL_QUALIFIERS =
  REQUIRED_DIRECT_QUALIFIERS + REQUIRED_THIRD_PLACE_QUALIFIERS;

type DirectSlotSpec = {
  groupCode: string;
  rank: 1 | 2;
  type: "direct";
};

type BestThirdSlotSpec = {
  allowedGroupCodes: string[];
  fifaSlot: FifaAnnexCSlot;
  type: "best-third";
};

type RoundOf32SlotSpec = DirectSlotSpec | BestThirdSlotSpec;

type RoundOf32MatchSpec = {
  away: RoundOf32SlotSpec;
  home: RoundOf32SlotSpec;
  matchNumber: number;
};

const FIFA_ROUND_OF_32_MATCHES: RoundOf32MatchSpec[] = [
  {
    away: { groupCode: "B", rank: 2, type: "direct" },
    home: { groupCode: "A", rank: 2, type: "direct" },
    matchNumber: 73,
  },
  {
    away: {
      allowedGroupCodes: ["A", "B", "C", "D", "F"],
      fifaSlot: "1E",
      type: "best-third",
    },
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
    away: {
      allowedGroupCodes: ["C", "D", "F", "G", "H"],
      fifaSlot: "1I",
      type: "best-third",
    },
    home: { groupCode: "I", rank: 1, type: "direct" },
    matchNumber: 77,
  },
  {
    away: { groupCode: "I", rank: 2, type: "direct" },
    home: { groupCode: "E", rank: 2, type: "direct" },
    matchNumber: 78,
  },
  {
    away: {
      allowedGroupCodes: ["C", "E", "F", "H", "I"],
      fifaSlot: "1A",
      type: "best-third",
    },
    home: { groupCode: "A", rank: 1, type: "direct" },
    matchNumber: 79,
  },
  {
    away: {
      allowedGroupCodes: ["E", "H", "I", "J", "K"],
      fifaSlot: "1L",
      type: "best-third",
    },
    home: { groupCode: "L", rank: 1, type: "direct" },
    matchNumber: 80,
  },
  {
    away: {
      allowedGroupCodes: ["B", "E", "F", "I", "J"],
      fifaSlot: "1D",
      type: "best-third",
    },
    home: { groupCode: "D", rank: 1, type: "direct" },
    matchNumber: 81,
  },
  {
    away: {
      allowedGroupCodes: ["A", "E", "H", "I", "J"],
      fifaSlot: "1G",
      type: "best-third",
    },
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
    away: {
      allowedGroupCodes: ["E", "F", "G", "I", "J"],
      fifaSlot: "1B",
      type: "best-third",
    },
    home: { groupCode: "B", rank: 1, type: "direct" },
    matchNumber: 85,
  },
  {
    away: { groupCode: "H", rank: 2, type: "direct" },
    home: { groupCode: "J", rank: 1, type: "direct" },
    matchNumber: 86,
  },
  {
    away: {
      allowedGroupCodes: ["D", "E", "I", "J", "L"],
      fifaSlot: "1K",
      type: "best-third",
    },
    home: { groupCode: "K", rank: 1, type: "direct" },
    matchNumber: 87,
  },
  {
    away: { groupCode: "G", rank: 2, type: "direct" },
    home: { groupCode: "D", rank: 2, type: "direct" },
    matchNumber: 88,
  },
];

function compareGroupCodes(left: string, right: string) {
  return left.localeCompare(right, "es-AR", {
    numeric: true,
    sensitivity: "base",
  });
}

function compareQualifiersByGroup(
  left: ProjectedQualifier,
  right: ProjectedQualifier,
) {
  return (
    compareGroupCodes(left.groupCode, right.groupCode) ||
    left.sourceRank - right.sourceRank ||
    left.team.name.localeCompare(right.team.name, "es-AR", {
      sensitivity: "base",
    }) ||
    left.team.id.localeCompare(right.team.id)
  );
}

function getRankedRow(
  group: TournamentGroupSimulation,
  rank: 1 | 2,
): TournamentStandingRow | null {
  return group.rows.find((row) => row.rank === rank) ?? group.rows[rank - 1] ?? null;
}

function createDirectQualifier(
  group: TournamentGroupSimulation,
  rank: 1 | 2,
): ProjectedQualifier | null {
  const row = getRankedRow(group, rank);

  if (!row) {
    return null;
  }

  return {
    groupCode: group.groupCode,
    isPlaceholder: false,
    originLabel: `${rank}° ${group.groupLabel}`,
    qualificationType: rank === 1 ? "Ganador de grupo" : "Segundo de grupo",
    slotLabel: `${rank}°${group.groupCode}`,
    sourceRank: rank,
    team: { ...row.team },
  };
}

function createBestThirdQualifier(
  row: RankedThirdPlacedTeam,
): ProjectedQualifier {
  return {
    groupCode: row.groupCode,
    isPlaceholder: false,
    originLabel: `Mejor 3° - ${row.groupLabel}`,
    qualificationType: "Mejor tercero",
    slotLabel: `3°${row.groupCode}`,
    sourceRank: 3,
    team: { ...row.team },
    thirdRank: row.thirdRank,
  };
}

function createPlaceholderSlot(
  slotLabel: string,
  sourceRank: ProjectedPlaceholderSlot["sourceRank"],
  ruleLabel?: string,
  allowedGroupCodes?: string[],
): ProjectedPlaceholderSlot {
  return {
    allowedGroupCodes,
    groupCode: null,
    isPlaceholder: true,
    originLabel: "Por definir",
    qualificationType: "Por definir",
    ruleLabel,
    slotLabel,
    sourceRank,
    team: {
      code: null,
      id: `placeholder-${slotLabel}`,
      name: "Por definir",
    },
  };
}

function bestThirdSlotLabel(allowedGroupCodes: string[]) {
  return `Mejor 3° ${allowedGroupCodes.join("/")}`;
}

function resolveRoundOf32Slot(
  spec: RoundOf32SlotSpec,
  directQualifiersBySlot: Map<string, ProjectedQualifier>,
  bestThirds: ProjectedQualifier[],
  thirdPlaceCombination: FifaAnnexCCombination | null,
): ProjectedBracketSlot {
  if (spec.type === "direct") {
    const slotLabel = `${spec.rank}°${spec.groupCode}`;

    return (
      directQualifiersBySlot.get(slotLabel) ??
      createPlaceholderSlot(slotLabel, spec.rank)
    );
  }

  const assignedGroupCode = thirdPlaceCombination?.slots[spec.fifaSlot];
  const eligibleBestThird = assignedGroupCode
    ? bestThirds.find((slot) => slot.groupCode === assignedGroupCode)
    : null;

  if (eligibleBestThird) {
    return {
      ...eligibleBestThird,
      ruleLabel: `Slot FIFA: ${spec.fifaSlot}`,
      slotLabel: `Mejor 3° ${assignedGroupCode}`,
    };
  }

  return createPlaceholderSlot(
    bestThirdSlotLabel(spec.allowedGroupCodes),
    3,
    `Slot FIFA: ${spec.fifaSlot}`,
    spec.allowedGroupCodes,
  );
}

function buildRoundOf32Matchups(
  directQualifiersBySlot: Map<string, ProjectedQualifier>,
  bestThirds: ProjectedQualifier[],
  thirdPlaceCombination: FifaAnnexCCombination | null,
): ProjectedBracketMatch[] {
  return FIFA_ROUND_OF_32_MATCHES.map((matchup) => ({
    away: resolveRoundOf32Slot(
      matchup.away,
      directQualifiersBySlot,
      bestThirds,
      thirdPlaceCombination,
    ),
    home: resolveRoundOf32Slot(
      matchup.home,
      directQualifiersBySlot,
      bestThirds,
      thirdPlaceCombination,
    ),
    id: `match-${matchup.matchNumber}`,
    matchNumber: matchup.matchNumber,
    roundLabel: "16avos",
    slotLabel: `Partido ${matchup.matchNumber}`,
  }));
}

function getSlotsByMatchNumber(
  thirdPlaceCombination: FifaAnnexCCombination | null,
) {
  if (!thirdPlaceCombination) {
    return null;
  }

  return Object.fromEntries(
    FIFA_ROUND_OF_32_MATCHES.flatMap((matchup) => {
      const slot = matchup.away.type === "best-third" ? matchup.away : null;

      return slot
        ? [[matchup.matchNumber, thirdPlaceCombination.slots[slot.fifaSlot]]]
        : [];
    }),
  ) as Record<number, string>;
}

export function buildProjectedBracket(
  groups: TournamentGroupSimulation[],
  thirdPlacedTeams: RankedThirdPlacedTeam[],
): ProjectedBracket {
  const sortedGroups = [...groups].sort((left, right) =>
    compareGroupCodes(left.groupCode, right.groupCode),
  );
  const directQualifiers = sortedGroups
    .flatMap((group) => [
      createDirectQualifier(group, 1),
      createDirectQualifier(group, 2),
    ])
    .filter((slot): slot is ProjectedQualifier => Boolean(slot))
    .sort(compareQualifiersByGroup);
  const directQualifiersBySlot = new Map(
    directQualifiers.map((slot) => [slot.slotLabel, slot]),
  );
  const winners = directQualifiers.filter((slot) => slot.sourceRank === 1);
  const runnersUp = directQualifiers.filter((slot) => slot.sourceRank === 2);
  const bestThirds = [...thirdPlacedTeams]
    .filter((row) => row.isQualified)
    .sort((left, right) => {
      return (
        left.thirdRank - right.thirdRank ||
        compareGroupCodes(left.groupCode, right.groupCode) ||
        left.team.id.localeCompare(right.team.id)
      );
    })
    .slice(0, REQUIRED_THIRD_PLACE_QUALIFIERS)
    .map(createBestThirdQualifier);
  const thirdPlaceCombination =
    bestThirds.length === REQUIRED_THIRD_PLACE_QUALIFIERS
      ? findFifaAnnexCCombination(bestThirds.map((slot) => slot.groupCode))
      : null;

  if (
    process.env.NODE_ENV === "development" &&
    bestThirds.length === REQUIRED_THIRD_PLACE_QUALIFIERS &&
    !thirdPlaceCombination
  ) {
    console.warn("[buildProjectedBracket] No FIFA Annex C row found", {
      groups: bestThirds.map((slot) => slot.groupCode).sort(),
    });
  }

  const projectedTeams = [...winners, ...runnersUp, ...bestThirds];
  const completedGroups = sortedGroups.filter((group) => group.isComplete).length;
  const hasCompleteInputs =
    sortedGroups.length >= REQUIRED_GROUPS &&
    completedGroups >= REQUIRED_GROUPS &&
    winners.length === REQUIRED_GROUPS &&
    runnersUp.length === REQUIRED_GROUPS &&
    bestThirds.length === REQUIRED_THIRD_PLACE_QUALIFIERS;
  const missingQualifiers = Math.max(
    0,
    REQUIRED_TOTAL_QUALIFIERS - projectedTeams.length,
  );

  return {
    completedGroups,
    isOfficialMapping: false,
    missingQualifiers,
    projectedTeams,
    requiredGroups: REQUIRED_GROUPS,
    requiredQualifiers: REQUIRED_TOTAL_QUALIFIERS,
    roundOf32: buildRoundOf32Matchups(
      directQualifiersBySlot,
      bestThirds,
      thirdPlaceCombination,
    ),
    status: hasCompleteInputs ? "complete" : "incomplete",
    thirdPlaceCombination: thirdPlaceCombination
      ? {
          groups: thirdPlaceCombination.groups,
          option: thirdPlaceCombination.option,
          slotsByMatchNumber: getSlotsByMatchNumber(thirdPlaceCombination) ?? {},
        }
      : null,
  };
}

import type {
  ProjectedBracketMatch,
  ProjectedBracketSlot,
} from "@/lib/tournament/types";

export type KnockoutSelectionMap = Record<string, string>;

export type DerivedRoundKey =
  | "roundOf32"
  | "roundOf16"
  | "quarterfinals"
  | "semifinals"
  | "thirdPlace"
  | "final";

export type DerivedKnockoutMatch = Omit<
  ProjectedBracketMatch,
  "roundLabel"
> & {
  roundKey: DerivedRoundKey;
  roundLabel:
    | "16avos"
    | "Octavos"
    | "Cuartos"
    | "Semifinales"
    | "3.º puesto"
    | "Final";
};

export type KnockoutSummary = {
  champion: ProjectedBracketSlot | null;
  fourthPlace: ProjectedBracketSlot | null;
  runnerUp: ProjectedBracketSlot | null;
  thirdPlace: ProjectedBracketSlot | null;
};

export type DerivedKnockoutRounds = {
  final: DerivedKnockoutMatch[];
  quarterfinals: DerivedKnockoutMatch[];
  roundOf16: DerivedKnockoutMatch[];
  roundOf32: DerivedKnockoutMatch[];
  semifinals: DerivedKnockoutMatch[];
  summary: KnockoutSummary;
  thirdPlace: DerivedKnockoutMatch[];
};

export type BracketBonusRule = {
  label: string;
  pointsPerHit: number;
  total: number;
};

type NextRoundSpec = {
  awayFrom: number;
  homeFrom: number;
  matchNumber: number;
  roundKey: DerivedRoundKey;
  roundLabel: DerivedKnockoutMatch["roundLabel"];
};

const ROUND_OF_16_SPECS: NextRoundSpec[] = [
  { awayFrom: 77, homeFrom: 74, matchNumber: 89, roundKey: "roundOf16", roundLabel: "Octavos" },
  { awayFrom: 75, homeFrom: 73, matchNumber: 90, roundKey: "roundOf16", roundLabel: "Octavos" },
  { awayFrom: 78, homeFrom: 76, matchNumber: 91, roundKey: "roundOf16", roundLabel: "Octavos" },
  { awayFrom: 80, homeFrom: 79, matchNumber: 92, roundKey: "roundOf16", roundLabel: "Octavos" },
  { awayFrom: 84, homeFrom: 83, matchNumber: 93, roundKey: "roundOf16", roundLabel: "Octavos" },
  { awayFrom: 82, homeFrom: 81, matchNumber: 94, roundKey: "roundOf16", roundLabel: "Octavos" },
  { awayFrom: 88, homeFrom: 86, matchNumber: 95, roundKey: "roundOf16", roundLabel: "Octavos" },
  { awayFrom: 87, homeFrom: 85, matchNumber: 96, roundKey: "roundOf16", roundLabel: "Octavos" },
];

const QUARTERFINAL_SPECS: NextRoundSpec[] = [
  { awayFrom: 90, homeFrom: 89, matchNumber: 97, roundKey: "quarterfinals", roundLabel: "Cuartos" },
  { awayFrom: 94, homeFrom: 93, matchNumber: 98, roundKey: "quarterfinals", roundLabel: "Cuartos" },
  { awayFrom: 92, homeFrom: 91, matchNumber: 99, roundKey: "quarterfinals", roundLabel: "Cuartos" },
  { awayFrom: 96, homeFrom: 95, matchNumber: 100, roundKey: "quarterfinals", roundLabel: "Cuartos" },
];

const SEMIFINAL_SPECS: NextRoundSpec[] = [
  { awayFrom: 98, homeFrom: 97, matchNumber: 101, roundKey: "semifinals", roundLabel: "Semifinales" },
  { awayFrom: 100, homeFrom: 99, matchNumber: 102, roundKey: "semifinals", roundLabel: "Semifinales" },
];

const FINAL_SPEC: NextRoundSpec = {
  awayFrom: 102,
  homeFrom: 101,
  matchNumber: 104,
  roundKey: "final",
  roundLabel: "Final",
};

const THIRD_PLACE_SPEC: NextRoundSpec = {
  awayFrom: 102,
  homeFrom: 101,
  matchNumber: 103,
  roundKey: "thirdPlace",
  roundLabel: "3.º puesto",
};

const BRACKET_BONUS_RULES: BracketBonusRule[] = [
  { label: "Equipos en octavos", pointsPerHit: 1, total: 16 },
  { label: "Equipos en cuartos", pointsPerHit: 1, total: 8 },
  { label: "Equipos en semifinales", pointsPerHit: 2, total: 8 },
  { label: "Campeón exacto", pointsPerHit: 10, total: 10 },
  { label: "Subcampeón exacto", pointsPerHit: 5, total: 5 },
  { label: "Tercer puesto exacto", pointsPerHit: 3, total: 3 },
  { label: "Cuarto puesto exacto", pointsPerHit: 2, total: 2 },
];

function cloneSlot(slot: ProjectedBracketSlot): ProjectedBracketSlot {
  return {
    ...slot,
    team: { ...slot.team },
  };
}

function toDerivedMatch(
  matchup: ProjectedBracketMatch,
  roundKey: DerivedRoundKey,
): DerivedKnockoutMatch {
  return {
    ...matchup,
    away: cloneSlot(matchup.away),
    home: cloneSlot(matchup.home),
    roundKey,
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

  const selectedSlot =
    matchup.home.team.id === selectedTeamId
      ? matchup.home
      : matchup.away.team.id === selectedTeamId
        ? matchup.away
        : null;

  if (!selectedSlot || selectedSlot.isPlaceholder) {
    return null;
  }

  return cloneSlot(selectedSlot);
}

function getLoserSlot(
  matchup: Pick<ProjectedBracketMatch, "away" | "home" | "id">,
  selections: KnockoutSelectionMap,
) {
  const winner = getSelectedSlot(matchup, selections);

  if (!winner) {
    return null;
  }

  const loser =
    matchup.home.team.id === winner.team.id ? matchup.away : matchup.home;

  return loser.isPlaceholder ? null : cloneSlot(loser);
}

function buildNextRoundMatch(
  spec: NextRoundSpec,
  winnersByMatchNumber: Map<number, ProjectedBracketSlot>,
) {
  const home = winnersByMatchNumber.get(spec.homeFrom);
  const away = winnersByMatchNumber.get(spec.awayFrom);

  if (!home || !away) {
    return null;
  }

  return {
    away,
    home,
    id: `match-${spec.matchNumber}`,
    matchNumber: spec.matchNumber,
    roundKey: spec.roundKey,
    roundLabel: spec.roundLabel,
    slotLabel: `Partido ${spec.matchNumber}`,
  } satisfies DerivedKnockoutMatch;
}

function buildNextRoundMatches(
  specs: NextRoundSpec[],
  winnersByMatchNumber: Map<number, ProjectedBracketSlot>,
) {
  const matches = specs.map((spec) =>
    buildNextRoundMatch(spec, winnersByMatchNumber),
  );

  return matches.every(Boolean)
    ? (matches as DerivedKnockoutMatch[])
    : [];
}

export function advanceBracketRound(
  matches: Pick<
    ProjectedBracketMatch,
    "away" | "home" | "id" | "matchNumber"
  >[],
  selections: KnockoutSelectionMap,
) {
  const winners: ProjectedBracketSlot[] = [];
  const losers: ProjectedBracketSlot[] = [];
  const winnersByMatchNumber = new Map<number, ProjectedBracketSlot>();
  const losersByMatchNumber = new Map<number, ProjectedBracketSlot>();

  for (const matchup of matches) {
    const winner = getSelectedSlot(matchup, selections);
    const loser = getLoserSlot(matchup, selections);

    if (!winner || !loser) {
      continue;
    }

    winners.push(winner);
    losers.push(loser);
    winnersByMatchNumber.set(matchup.matchNumber, winner);
    losersByMatchNumber.set(matchup.matchNumber, loser);
  }

  return {
    isComplete: winners.length === matches.length,
    losers,
    losersByMatchNumber,
    winners,
    winnersByMatchNumber,
  };
}

export function buildDerivedKnockoutRounds(
  roundOf32: ProjectedBracketMatch[],
  selections: KnockoutSelectionMap,
): DerivedKnockoutRounds {
  const derivedRoundOf32 = roundOf32.map((matchup) =>
    toDerivedMatch(matchup, "roundOf32"),
  );
  const roundOf32Result = advanceBracketRound(derivedRoundOf32, selections);
  const roundOf16 = roundOf32Result.isComplete
    ? buildNextRoundMatches(ROUND_OF_16_SPECS, roundOf32Result.winnersByMatchNumber)
    : [];
  const roundOf16Result = advanceBracketRound(roundOf16, selections);
  const quarterfinals = roundOf16Result.isComplete
    ? buildNextRoundMatches(QUARTERFINAL_SPECS, roundOf16Result.winnersByMatchNumber)
    : [];
  const quarterfinalResult = advanceBracketRound(quarterfinals, selections);
  const semifinals = quarterfinalResult.isComplete
    ? buildNextRoundMatches(SEMIFINAL_SPECS, quarterfinalResult.winnersByMatchNumber)
    : [];
  const semifinalResult = advanceBracketRound(semifinals, selections);
  const final =
    semifinalResult.isComplete && semifinals.length > 0
      ? [
          buildNextRoundMatch(
            FINAL_SPEC,
            semifinalResult.winnersByMatchNumber,
          ),
        ].filter((matchup): matchup is DerivedKnockoutMatch => Boolean(matchup))
      : [];
  const thirdPlace =
    semifinalResult.isComplete && semifinals.length > 0
      ? [
          buildNextRoundMatch(
            THIRD_PLACE_SPEC,
            semifinalResult.losersByMatchNumber,
          ),
        ].filter((matchup): matchup is DerivedKnockoutMatch => Boolean(matchup))
      : [];
  const finalWinner = final[0] ? getSelectedSlot(final[0], selections) : null;
  const finalLoser = final[0] ? getLoserSlot(final[0], selections) : null;
  const thirdPlaceWinner = thirdPlace[0]
    ? getSelectedSlot(thirdPlace[0], selections)
    : null;
  const thirdPlaceLoser = thirdPlace[0]
    ? getLoserSlot(thirdPlace[0], selections)
    : null;

  return {
    final,
    quarterfinals,
    roundOf16,
    roundOf32: derivedRoundOf32,
    semifinals,
    summary: {
      champion: finalWinner,
      fourthPlace: thirdPlaceLoser,
      runnerUp: finalLoser,
      thirdPlace: thirdPlaceWinner,
    },
    thirdPlace,
  };
}

export function getBracketBonusPreview() {
  return {
    maxPossiblePoints: BRACKET_BONUS_RULES.reduce(
      (total, rule) => total + rule.total,
      0,
    ),
    rules: BRACKET_BONUS_RULES,
  };
}

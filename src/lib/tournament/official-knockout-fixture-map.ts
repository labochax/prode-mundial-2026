export type OfficialKnockoutFixtureMapEntry = {
  awayTla?: string;
  footballDataId: number;
  homeTla?: string;
  label?: string;
  matchNumber: number;
  round?: "round-32";
  stage?: "LAST_32";
};

export type OfficialRoundOf16AdvancementMapEntry = {
  awaySourceFootballDataId: number;
  awaySourceMatchNumber: number;
  awaySourceOutcome: "winner";
  homeSourceFootballDataId: number;
  homeSourceMatchNumber: number;
  homeSourceOutcome: "winner";
  label: string;
  round: "round-16";
  stage: "LAST_16";
  targetFootballDataId: number;
  targetMatchNumber: number;
};

export type OfficialKnockoutAdvancementOutcome = "loser" | "winner";

export type OfficialKnockoutAdvancementMapEntry = {
  awaySourceFootballDataId: number;
  awaySourceMatchNumber: number;
  awaySourceOutcome: OfficialKnockoutAdvancementOutcome;
  homeSourceFootballDataId: number;
  homeSourceMatchNumber: number;
  homeSourceOutcome: OfficialKnockoutAdvancementOutcome;
  label: string;
  round:
    | "final"
    | "quarter-finals"
    | "round-16"
    | "semi-finals"
    | "third-place";
  stage:
    | "FINAL"
    | "LAST_16"
    | "QUARTER_FINALS"
    | "SEMI_FINALS"
    | "THIRD_PLACE";
  targetFootballDataId: number;
  targetMatchNumber: number;
};

// No inferir match_number por horario: si Football-Data no informa equipos
// directos y este mapa no conoce el fixture, el cruce debe quedar bloqueado.
export const OFFICIAL_ROUND_OF_32_FIXTURE_MAP =
  [
    {
      awayTla: "CAN",
      footballDataId: 537417,
      homeTla: "RSA",
      label: "RSA vs CAN - South Africa v Canada",
      matchNumber: 73,
      round: "round-32",
      stage: "LAST_32",
    },
    {
      awayTla: "PAR",
      footballDataId: 537415,
      homeTla: "GER",
      label: "GER vs PAR - Germany v Paraguay",
      matchNumber: 74,
      round: "round-32",
      stage: "LAST_32",
    },
    {
      awayTla: "MAR",
      footballDataId: 537418,
      homeTla: "NED",
      label: "NED vs MAR - Netherlands v Morocco",
      matchNumber: 75,
      round: "round-32",
      stage: "LAST_32",
    },
    {
      awayTla: "JPN",
      footballDataId: 537423,
      homeTla: "BRA",
      label: "BRA vs JPN - Brazil v Japan",
      matchNumber: 76,
      round: "round-32",
      stage: "LAST_32",
    },
    {
      awayTla: "SWE",
      footballDataId: 537416,
      homeTla: "FRA",
      label: "FRA vs SWE - France v Sweden",
      matchNumber: 77,
      round: "round-32",
      stage: "LAST_32",
    },
    {
      awayTla: "NOR",
      footballDataId: 537424,
      homeTla: "CIV",
      label: "CIV vs NOR - Ivory Coast v Norway",
      matchNumber: 78,
      round: "round-32",
      stage: "LAST_32",
    },
    {
      awayTla: "ECU",
      footballDataId: 537425,
      homeTla: "MEX",
      label: "MEX vs ECU - Mexico v Ecuador",
      matchNumber: 79,
      round: "round-32",
      stage: "LAST_32",
    },
    {
      awayTla: "COD",
      footballDataId: 537426,
      homeTla: "ENG",
      label: "ENG vs COD - England v DR Congo",
      matchNumber: 80,
      round: "round-32",
      stage: "LAST_32",
    },
    {
      awayTla: "BIH",
      footballDataId: 537421,
      homeTla: "USA",
      label: "USA vs BIH - USA v Bosnia and Herzegovina",
      matchNumber: 81,
      round: "round-32",
      stage: "LAST_32",
    },
    {
      awayTla: "SEN",
      footballDataId: 537422,
      homeTla: "BEL",
      label: "BEL vs SEN - Belgium v Senegal",
      matchNumber: 82,
      round: "round-32",
      stage: "LAST_32",
    },
    {
      awayTla: "CRO",
      footballDataId: 537419,
      homeTla: "POR",
      label: "POR vs CRO - Portugal v Croatia",
      matchNumber: 83,
      round: "round-32",
      stage: "LAST_32",
    },
    {
      awayTla: "AUT",
      footballDataId: 537420,
      homeTla: "ESP",
      label: "ESP vs AUT - Spain v Austria",
      matchNumber: 84,
      round: "round-32",
      stage: "LAST_32",
    },
    {
      awayTla: "ALG",
      footballDataId: 537429,
      homeTla: "SUI",
      label: "SUI vs ALG - Switzerland v Algeria",
      matchNumber: 85,
      round: "round-32",
      stage: "LAST_32",
    },
    {
      awayTla: "CPV",
      footballDataId: 537427,
      homeTla: "ARG",
      label: "ARG vs CPV - Argentina v Cape Verde",
      matchNumber: 86,
      round: "round-32",
      stage: "LAST_32",
    },
    {
      awayTla: "GHA",
      footballDataId: 537430,
      homeTla: "COL",
      label: "COL vs GHA - Colombia v Ghana",
      matchNumber: 87,
      round: "round-32",
      stage: "LAST_32",
    },
    {
      awayTla: "EGY",
      footballDataId: 537428,
      homeTla: "AUS",
      label: "AUS vs EGY - Australia v Egypt",
      matchNumber: 88,
      round: "round-32",
      stage: "LAST_32",
    },
  ] as const satisfies readonly OfficialKnockoutFixtureMapEntry[];

export const OFFICIAL_ROUND_OF_16_ADVANCEMENT_MAP =
  [
    {
      awaySourceFootballDataId: 537416,
      awaySourceMatchNumber: 77,
      awaySourceOutcome: "winner",
      homeSourceFootballDataId: 537415,
      homeSourceMatchNumber: 74,
      homeSourceOutcome: "winner",
      label: "M89 - Winner M74 vs Winner M77",
      round: "round-16",
      stage: "LAST_16",
      targetFootballDataId: 537375,
      targetMatchNumber: 89,
    },
    {
      awaySourceFootballDataId: 537418,
      awaySourceMatchNumber: 75,
      awaySourceOutcome: "winner",
      homeSourceFootballDataId: 537417,
      homeSourceMatchNumber: 73,
      homeSourceOutcome: "winner",
      label: "M90 - Winner M73 vs Winner M75",
      round: "round-16",
      stage: "LAST_16",
      targetFootballDataId: 537376,
      targetMatchNumber: 90,
    },
    {
      awaySourceFootballDataId: 537424,
      awaySourceMatchNumber: 78,
      awaySourceOutcome: "winner",
      homeSourceFootballDataId: 537423,
      homeSourceMatchNumber: 76,
      homeSourceOutcome: "winner",
      label: "M91 - Winner M76 vs Winner M78",
      round: "round-16",
      stage: "LAST_16",
      targetFootballDataId: 537377,
      targetMatchNumber: 91,
    },
    {
      awaySourceFootballDataId: 537426,
      awaySourceMatchNumber: 80,
      awaySourceOutcome: "winner",
      homeSourceFootballDataId: 537425,
      homeSourceMatchNumber: 79,
      homeSourceOutcome: "winner",
      label: "M92 - Winner M79 vs Winner M80",
      round: "round-16",
      stage: "LAST_16",
      targetFootballDataId: 537378,
      targetMatchNumber: 92,
    },
    {
      awaySourceFootballDataId: 537420,
      awaySourceMatchNumber: 84,
      awaySourceOutcome: "winner",
      homeSourceFootballDataId: 537419,
      homeSourceMatchNumber: 83,
      homeSourceOutcome: "winner",
      label: "M93 - Winner M83 vs Winner M84",
      round: "round-16",
      stage: "LAST_16",
      targetFootballDataId: 537379,
      targetMatchNumber: 93,
    },
    {
      awaySourceFootballDataId: 537422,
      awaySourceMatchNumber: 82,
      awaySourceOutcome: "winner",
      homeSourceFootballDataId: 537421,
      homeSourceMatchNumber: 81,
      homeSourceOutcome: "winner",
      label: "M94 - Winner M81 vs Winner M82",
      round: "round-16",
      stage: "LAST_16",
      targetFootballDataId: 537380,
      targetMatchNumber: 94,
    },
    {
      awaySourceFootballDataId: 537428,
      awaySourceMatchNumber: 88,
      awaySourceOutcome: "winner",
      homeSourceFootballDataId: 537427,
      homeSourceMatchNumber: 86,
      homeSourceOutcome: "winner",
      label: "M95 - Winner M86 vs Winner M88",
      round: "round-16",
      stage: "LAST_16",
      targetFootballDataId: 537381,
      targetMatchNumber: 95,
    },
    {
      awaySourceFootballDataId: 537430,
      awaySourceMatchNumber: 87,
      awaySourceOutcome: "winner",
      homeSourceFootballDataId: 537429,
      homeSourceMatchNumber: 85,
      homeSourceOutcome: "winner",
      label: "M96 - Winner M85 vs Winner M87",
      round: "round-16",
      stage: "LAST_16",
      targetFootballDataId: 537382,
      targetMatchNumber: 96,
    },
  ] as const satisfies readonly OfficialRoundOf16AdvancementMapEntry[];

export const OFFICIAL_KNOCKOUT_ADVANCEMENT_MAP =
  [
    ...OFFICIAL_ROUND_OF_16_ADVANCEMENT_MAP,
    {
      awaySourceFootballDataId: 537376,
      awaySourceMatchNumber: 90,
      awaySourceOutcome: "winner",
      homeSourceFootballDataId: 537375,
      homeSourceMatchNumber: 89,
      homeSourceOutcome: "winner",
      label: "M97 - Winner M89 vs Winner M90",
      round: "quarter-finals",
      stage: "QUARTER_FINALS",
      targetFootballDataId: 537383,
      targetMatchNumber: 97,
    },
    {
      awaySourceFootballDataId: 537378,
      awaySourceMatchNumber: 92,
      awaySourceOutcome: "winner",
      homeSourceFootballDataId: 537377,
      homeSourceMatchNumber: 91,
      homeSourceOutcome: "winner",
      label: "M98 - Winner M91 vs Winner M92",
      round: "quarter-finals",
      stage: "QUARTER_FINALS",
      targetFootballDataId: 537384,
      targetMatchNumber: 98,
    },
    {
      awaySourceFootballDataId: 537380,
      awaySourceMatchNumber: 94,
      awaySourceOutcome: "winner",
      homeSourceFootballDataId: 537379,
      homeSourceMatchNumber: 93,
      homeSourceOutcome: "winner",
      label: "M99 - Winner M93 vs Winner M94",
      round: "quarter-finals",
      stage: "QUARTER_FINALS",
      targetFootballDataId: 537385,
      targetMatchNumber: 99,
    },
    {
      awaySourceFootballDataId: 537382,
      awaySourceMatchNumber: 96,
      awaySourceOutcome: "winner",
      homeSourceFootballDataId: 537381,
      homeSourceMatchNumber: 95,
      homeSourceOutcome: "winner",
      label: "M100 - Winner M95 vs Winner M96",
      round: "quarter-finals",
      stage: "QUARTER_FINALS",
      targetFootballDataId: 537386,
      targetMatchNumber: 100,
    },
    {
      awaySourceFootballDataId: 537384,
      awaySourceMatchNumber: 98,
      awaySourceOutcome: "winner",
      homeSourceFootballDataId: 537383,
      homeSourceMatchNumber: 97,
      homeSourceOutcome: "winner",
      label: "M101 - Winner M97 vs Winner M98",
      round: "semi-finals",
      stage: "SEMI_FINALS",
      targetFootballDataId: 537387,
      targetMatchNumber: 101,
    },
    {
      awaySourceFootballDataId: 537386,
      awaySourceMatchNumber: 100,
      awaySourceOutcome: "winner",
      homeSourceFootballDataId: 537385,
      homeSourceMatchNumber: 99,
      homeSourceOutcome: "winner",
      label: "M102 - Winner M99 vs Winner M100",
      round: "semi-finals",
      stage: "SEMI_FINALS",
      targetFootballDataId: 537388,
      targetMatchNumber: 102,
    },
    {
      awaySourceFootballDataId: 537388,
      awaySourceMatchNumber: 102,
      awaySourceOutcome: "loser",
      homeSourceFootballDataId: 537387,
      homeSourceMatchNumber: 101,
      homeSourceOutcome: "loser",
      label: "M103 - Loser M101 vs Loser M102",
      round: "third-place",
      stage: "THIRD_PLACE",
      targetFootballDataId: 537389,
      targetMatchNumber: 103,
    },
    {
      awaySourceFootballDataId: 537388,
      awaySourceMatchNumber: 102,
      awaySourceOutcome: "winner",
      homeSourceFootballDataId: 537387,
      homeSourceMatchNumber: 101,
      homeSourceOutcome: "winner",
      label: "M104 - Winner M101 vs Winner M102",
      round: "final",
      stage: "FINAL",
      targetFootballDataId: 537390,
      targetMatchNumber: 104,
    },
  ] as const satisfies readonly OfficialKnockoutAdvancementMapEntry[];

export function getOfficialRoundOf32FixtureMapEntry(
  footballDataId: number | null | undefined,
  fixtureMap: readonly OfficialKnockoutFixtureMapEntry[] =
    OFFICIAL_ROUND_OF_32_FIXTURE_MAP,
) {
  if (typeof footballDataId !== "number") {
    return null;
  }

  return fixtureMap.find((entry) => entry.footballDataId === footballDataId) ?? null;
}

export function getOfficialRoundOf32MatchNumberForFootballDataId(
  footballDataId: number | null | undefined,
  fixtureMap: readonly OfficialKnockoutFixtureMapEntry[] =
    OFFICIAL_ROUND_OF_32_FIXTURE_MAP,
) {
  return getOfficialRoundOf32FixtureMapEntry(footballDataId, fixtureMap)
    ?.matchNumber ?? null;
}

export function getOfficialRoundOf32FixtureTlas(
  fixtureMap: readonly OfficialKnockoutFixtureMapEntry[] =
    OFFICIAL_ROUND_OF_32_FIXTURE_MAP,
) {
  return [
    ...new Set(
      fixtureMap.flatMap((entry) =>
        [entry.homeTla, entry.awayTla].filter((tla): tla is string =>
          Boolean(tla),
        ),
      ),
    ),
  ];
}

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
  homeSourceFootballDataId: number;
  homeSourceMatchNumber: number;
  label: string;
  round: "round-16";
  stage: "LAST_16";
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
      homeSourceFootballDataId: 537415,
      homeSourceMatchNumber: 74,
      label: "M89 - Winner M74 vs Winner M77",
      round: "round-16",
      stage: "LAST_16",
      targetFootballDataId: 537375,
      targetMatchNumber: 89,
    },
    {
      awaySourceFootballDataId: 537418,
      awaySourceMatchNumber: 75,
      homeSourceFootballDataId: 537417,
      homeSourceMatchNumber: 73,
      label: "M90 - Winner M73 vs Winner M75",
      round: "round-16",
      stage: "LAST_16",
      targetFootballDataId: 537376,
      targetMatchNumber: 90,
    },
    {
      awaySourceFootballDataId: 537424,
      awaySourceMatchNumber: 78,
      homeSourceFootballDataId: 537423,
      homeSourceMatchNumber: 76,
      label: "M91 - Winner M76 vs Winner M78",
      round: "round-16",
      stage: "LAST_16",
      targetFootballDataId: 537377,
      targetMatchNumber: 91,
    },
    {
      awaySourceFootballDataId: 537426,
      awaySourceMatchNumber: 80,
      homeSourceFootballDataId: 537425,
      homeSourceMatchNumber: 79,
      label: "M92 - Winner M79 vs Winner M80",
      round: "round-16",
      stage: "LAST_16",
      targetFootballDataId: 537378,
      targetMatchNumber: 92,
    },
    {
      awaySourceFootballDataId: 537420,
      awaySourceMatchNumber: 84,
      homeSourceFootballDataId: 537419,
      homeSourceMatchNumber: 83,
      label: "M93 - Winner M83 vs Winner M84",
      round: "round-16",
      stage: "LAST_16",
      targetFootballDataId: 537379,
      targetMatchNumber: 93,
    },
    {
      awaySourceFootballDataId: 537422,
      awaySourceMatchNumber: 82,
      homeSourceFootballDataId: 537421,
      homeSourceMatchNumber: 81,
      label: "M94 - Winner M81 vs Winner M82",
      round: "round-16",
      stage: "LAST_16",
      targetFootballDataId: 537380,
      targetMatchNumber: 94,
    },
    {
      awaySourceFootballDataId: 537428,
      awaySourceMatchNumber: 88,
      homeSourceFootballDataId: 537427,
      homeSourceMatchNumber: 86,
      label: "M95 - Winner M86 vs Winner M88",
      round: "round-16",
      stage: "LAST_16",
      targetFootballDataId: 537381,
      targetMatchNumber: 95,
    },
    {
      awaySourceFootballDataId: 537430,
      awaySourceMatchNumber: 87,
      homeSourceFootballDataId: 537429,
      homeSourceMatchNumber: 85,
      label: "M96 - Winner M85 vs Winner M87",
      round: "round-16",
      stage: "LAST_16",
      targetFootballDataId: 537382,
      targetMatchNumber: 96,
    },
  ] as const satisfies readonly OfficialRoundOf16AdvancementMapEntry[];

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

export type OfficialKnockoutFixtureMapEntry = {
  awayTla?: string;
  footballDataId: number;
  homeTla?: string;
  label?: string;
  matchNumber: number;
  round?: "round-32";
  stage?: "LAST_32";
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

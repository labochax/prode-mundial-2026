export type OfficialKnockoutFixtureMapEntry = {
  footballDataId: number;
  matchNumber: number;
};

// Intencionalmente vacio hasta cargar IDs de fixture verificados.
// No inferir match_number por horario: si Football-Data no informa equipos
// directos y este mapa no conoce el fixture, el cruce debe quedar bloqueado.
export const OFFICIAL_ROUND_OF_32_FIXTURE_MAP =
  [] satisfies OfficialKnockoutFixtureMapEntry[];

export function getOfficialRoundOf32MatchNumberForFootballDataId(
  footballDataId: number | null | undefined,
  fixtureMap: readonly OfficialKnockoutFixtureMapEntry[] =
    OFFICIAL_ROUND_OF_32_FIXTURE_MAP,
) {
  if (typeof footballDataId !== "number") {
    return null;
  }

  return (
    fixtureMap.find((entry) => entry.footballDataId === footballDataId)
      ?.matchNumber ?? null
  );
}

export type TeamAssetCandidateForMatch = {
  sportsdb_id: string;
  team_name: string;
};

export type TeamCandidateMatchResult<T extends TeamAssetCandidateForMatch> =
  | {
      candidate: T;
      matchedBy: string;
      status: "matched";
    }
  | {
      candidates: T[];
      reason: string;
      status: "ambiguous";
    }
  | {
      reason: string;
      status: "no_match";
    };

const teamAliasEntries = [
  ["Bosnia-H.", ["Bosnia and Herzegovina", "Bosnia & Herzegovina"]],
  ["Bosnia-Herzegovina", ["Bosnia and Herzegovina", "Bosnia & Herzegovina"]],
  [
    "Bosnia and Herzegovina",
    ["Bosnia-H.", "Bosnia-Herzegovina", "Bosnia & Herzegovina"],
  ],
  ["Cape Verde", ["Cabo Verde", "Cape Verde Islands"]],
  ["Cabo Verde", ["Cape Verde", "Cape Verde Islands"]],
  ["Congo DR", ["DR Congo", "Democratic Republic of the Congo"]],
  ["DR Congo", ["Congo DR", "Democratic Republic of the Congo"]],
  ["Côte d'Ivoire", ["Ivory Coast", "Cote d'Ivoire"]],
  ["Cote d'Ivoire", ["Ivory Coast", "Côte d'Ivoire"]],
  ["Curaçao", ["Curacao"]],
  ["Curacao", ["Curaçao"]],
  ["Czech Republic", ["Czechia"]],
  ["Czechia", ["Czech Republic"]],
  ["IR Iran", ["Iran"]],
  ["Iran", ["IR Iran"]],
  ["Ivory Coast", ["Côte d'Ivoire", "Cote d'Ivoire"]],
  ["Korea Republic", ["South Korea"]],
  ["South Korea", ["Korea Republic"]],
  ["Türkiye", ["Turkey", "Turkiye"]],
  ["Turkiye", ["Turkey", "Türkiye"]],
  ["Turkey", ["Türkiye", "Turkiye"]],
  ["USA", ["United States", "United States of America"]],
  ["United States", ["USA", "United States of America"]],
  ["United States of America", ["USA", "United States"]],
] as const;

const aliasesByNormalizedName = new Map(
  teamAliasEntries.map(([name, aliases]) => [
    normalizeTeamNameForMatch(name),
    aliases,
  ]),
);

export function normalizeTeamNameForMatch(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueByNormalizedName(names: string[]) {
  const seen = new Set<string>();
  const uniqueNames: string[] = [];

  for (const name of names) {
    const normalized = normalizeTeamNameForMatch(name);

    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    uniqueNames.push(name);
  }

  return uniqueNames;
}

export function getTeamSearchNames(teamName: string) {
  const normalizedName = normalizeTeamNameForMatch(teamName);
  const aliases = aliasesByNormalizedName.get(normalizedName) ?? [];

  return uniqueByNormalizedName([teamName, ...aliases]);
}

export function chooseBestTeamCandidate<T extends TeamAssetCandidateForMatch>(
  teamName: string,
  candidates: readonly T[],
): TeamCandidateMatchResult<T> {
  const searchNames = getTeamSearchNames(teamName);
  const normalizedSearchNames = new Set(
    searchNames.map((name) => normalizeTeamNameForMatch(name)),
  );
  const matches = candidates.filter((candidate) =>
    normalizedSearchNames.has(normalizeTeamNameForMatch(candidate.team_name)),
  );

  if (matches.length === 1) {
    const matchedBy =
      searchNames.find(
        (name) =>
          normalizeTeamNameForMatch(name) ===
          normalizeTeamNameForMatch(matches[0].team_name),
      ) ?? teamName;

    return {
      candidate: matches[0],
      matchedBy,
      status: "matched",
    };
  }

  if (matches.length > 1) {
    return {
      candidates: matches,
      reason: `Mas de un candidato coincide con ${teamName}.`,
      status: "ambiguous",
    };
  }

  return {
    reason: `No normalized candidate matched ${teamName}.`,
    status: "no_match",
  };
}

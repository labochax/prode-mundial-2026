import type {
  LeaderboardGroupDimension,
  LeaderboardPlayer,
} from "@/lib/leaderboard/leaderboard-types";
import {
  normalizeProfileSuggestionKey,
  normalizeProfileText,
} from "@/lib/profiles/profile-normalization";

export type LeaderboardGroupDimensionOption = {
  label: string;
  value: LeaderboardGroupDimension;
};

export type LeaderboardGroupFilterValue = {
  label: string;
  normalizedValue: string;
};

export type LeaderboardActiveGroupFilter = LeaderboardGroupFilterValue & {
  dimension: LeaderboardGroupDimension;
};

const ageBuckets = [
  {
    label: "Menos de 18",
    max: 17,
    min: 1,
  },
  {
    label: "18–25",
    max: 25,
    min: 18,
  },
  {
    label: "26–34",
    max: 34,
    min: 26,
  },
  {
    label: "35–45",
    max: 45,
    min: 35,
  },
  {
    label: "46–55",
    max: 55,
    min: 46,
  },
  {
    label: "56+",
    max: 120,
    min: 56,
  },
] as const;

export const leaderboardGroupDimensions = [
  {
    label: "Subgrupo",
    value: "subgroup",
  },
  {
    label: "Club",
    value: "favoriteTeam",
  },
  {
    label: "Colegio",
    value: "school",
  },
  {
    label: "Grupo etario",
    value: "ageGroup",
  },
  {
    label: "País",
    value: "country",
  },
  {
    label: "Provincia",
    value: "province",
  },
  {
    label: "Ciudad",
    value: "city",
  },
] as const satisfies LeaderboardGroupDimensionOption[];

export function getLeaderboardGroupDimensionLabel(
  dimension: LeaderboardGroupDimension,
) {
  return (
    leaderboardGroupDimensions.find((option) => option.value === dimension)
      ?.label ?? "Filtro"
  );
}

export function getAgeGroupLabel(age: number | null) {
  if (!age) {
    return null;
  }

  const bucket = ageBuckets.find(
    (candidate) => age >= candidate.min && age <= candidate.max,
  );

  return bucket?.label ?? null;
}

function getPlayerDimensionValues(
  player: LeaderboardPlayer,
  dimension: LeaderboardGroupDimension,
) {
  switch (dimension) {
    case "ageGroup":
      return [getAgeGroupLabel(player.groups.age)];
    case "city":
      return [player.groups.city];
    case "country":
      return [player.groups.country];
    case "favoriteTeam":
      return [player.groups.favoriteTeam];
    case "province":
      return [player.groups.province];
    case "school":
      return [player.groups.school];
    case "subgroup":
      return player.groups.subgroups;
  }
}

function playerMatchesGroupFilter(
  player: LeaderboardPlayer,
  filter: LeaderboardActiveGroupFilter,
) {
  return getPlayerDimensionValues(player, filter.dimension).some(
    (value) =>
      value &&
      normalizeProfileSuggestionKey(value) === filter.normalizedValue,
  );
}

export function filterLeaderboardPlayersByGroups(
  players: LeaderboardPlayer[],
  filters: LeaderboardActiveGroupFilter[],
) {
  if (filters.length === 0) {
    return [];
  }

  return players.filter((player) =>
    filters.every((filter) => playerMatchesGroupFilter(player, filter)),
  );
}

export function getLeaderboardGroupValues(
  players: LeaderboardPlayer[],
  dimension: LeaderboardGroupDimension,
  activeFilters: LeaderboardActiveGroupFilter[] = [],
) {
  const filtersForOtherDimensions = activeFilters.filter(
    (filter) => filter.dimension !== dimension,
  );
  const eligiblePlayers =
    filtersForOtherDimensions.length > 0
      ? filterLeaderboardPlayersByGroups(players, filtersForOtherDimensions)
      : players;
  const values = new Map<string, string>();

  for (const player of eligiblePlayers) {
    for (const value of getPlayerDimensionValues(player, dimension)) {
      if (!value) {
        continue;
      }

      const displayValue = normalizeProfileText(value);

      if (!displayValue) {
        continue;
      }

      const normalizedValue = normalizeProfileSuggestionKey(displayValue);

      if (!values.has(normalizedValue)) {
        values.set(normalizedValue, displayValue);
      }
    }
  }

  return [...values.entries()]
    .map(([normalizedValue, label]) => ({
      label,
      normalizedValue,
    }))
    .sort((left, right) => left.label.localeCompare(right.label, "es-AR"));
}

export function getCurrentPlayerDefaultGroupValue(
  player: LeaderboardPlayer | undefined,
  dimension: LeaderboardGroupDimension,
) {
  if (!player) {
    return null;
  }

  const value = getPlayerDimensionValues(player, dimension)
    .map((item) => (item ? normalizeProfileText(item) : null))
    .find((item): item is string => Boolean(item));

  if (!value) {
    return null;
  }

  return {
    label: value,
    normalizedValue: normalizeProfileSuggestionKey(value),
  } satisfies LeaderboardGroupFilterValue;
}

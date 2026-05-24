import "server-only";

import { getFootballDataEnv } from "@/lib/sports/env.server";
import {
  mapFootballDataMatchToCandidate,
  mapFootballDataTeamToCandidate,
} from "@/lib/sports/football-data/mappers";
import type {
  FootballDataDryRunPreview,
  FootballDataMatchesResponse,
  FootballDataRateLimitInfo,
  FootballDataTeamsResponse,
} from "@/lib/sports/football-data/types";

const footballDataBaseUrl = "https://api.football-data.org/v4";

export class FootballDataApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly rateLimit?: FootballDataRateLimitInfo,
  ) {
    super(message);
    this.name = "FootballDataApiError";
  }
}

function getRateLimitInfo(headers: Headers): FootballDataRateLimitInfo {
  return {
    apiVersion: headers.get("x-api-version"),
    authenticatedClient: headers.get("x-authenticated-client"),
    requestCounterReset: headers.get("x-requestcounter-reset"),
    requestsAvailable: headers.get("x-requestsavailable"),
  };
}

function buildUrl(pathname: string, searchParams?: Record<string, string>) {
  const url = new URL(`${footballDataBaseUrl}${pathname}`);

  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  return url;
}

async function footballDataFetch<T>(
  pathname: string,
  searchParams?: Record<string, string>,
): Promise<{ data: T; rateLimit: FootballDataRateLimitInfo }> {
  const { token } = getFootballDataEnv();
  const response = await fetch(buildUrl(pathname, searchParams), {
    headers: {
      "X-Auth-Token": token,
    },
    next: {
      revalidate: 0,
    },
  });
  const rateLimit = getRateLimitInfo(response.headers);

  if (!response.ok) {
    throw new FootballDataApiError(
      `Football-Data respondió ${response.status}.`,
      response.status,
      rateLimit,
    );
  }

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw new FootballDataApiError(
      "Football-Data devolvió una respuesta que no es JSON válido.",
      response.status,
      rateLimit,
    );
  }

  return {
    data: data as T,
    rateLimit,
  };
}

export async function fetchFootballDataCompetitionTeams(
  competitionCode = "WC",
  season?: string,
) {
  return footballDataFetch<FootballDataTeamsResponse>(
    `/competitions/${competitionCode}/teams`,
    season ? { season } : undefined,
  );
}

export async function fetchFootballDataCompetitionMatches(
  competitionCode = "WC",
  options?: {
    dateFrom?: string;
    dateTo?: string;
    season?: string;
    status?: string;
  },
) {
  return footballDataFetch<FootballDataMatchesResponse>(
    `/competitions/${competitionCode}/matches`,
    options,
  );
}

export async function fetchFootballDataDryRunPreview(options?: {
  competitionCode?: string;
  dateFrom?: string;
  dateTo?: string;
  season?: string;
}) {
  const competitionCode = options?.competitionCode ?? "WC";
  const [teamsResponse, matchesResponse] = await Promise.all([
    fetchFootballDataCompetitionTeams(competitionCode, options?.season),
    fetchFootballDataCompetitionMatches(competitionCode, {
      dateFrom: options?.dateFrom,
      dateTo: options?.dateTo,
      season: options?.season,
    }),
  ]);

  const teams = teamsResponse.data.teams ?? [];
  const matches = matchesResponse.data.matches ?? [];

  return {
    matches: matches.slice(0, 8).map((match) => mapFootballDataMatchToCandidate(match)),
    rateLimit: matchesResponse.rateLimit,
    teams: teams.slice(0, 8).map((team) => mapFootballDataTeamToCandidate(team)),
  } satisfies FootballDataDryRunPreview;
}

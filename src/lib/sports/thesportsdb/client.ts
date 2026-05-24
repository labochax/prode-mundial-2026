import "server-only";

import { getTheSportsDbEnv } from "@/lib/sports/env.server";
import {
  mapTheSportsDbTeamToAssetCandidate,
  mapTheSportsDbVenueToAssetCandidate,
} from "@/lib/sports/thesportsdb/mappers";
import type {
  TheSportsDbTeamsResponse,
  TheSportsDbVenuesResponse,
} from "@/lib/sports/thesportsdb/types";

const theSportsDbBaseUrl = "https://www.thesportsdb.com/api/v1/json";

export class TheSportsDbApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "TheSportsDbApiError";
  }
}

function buildUrl(pathname: string, searchParams?: Record<string, string>) {
  const { apiKey } = getTheSportsDbEnv();
  const url = new URL(`${theSportsDbBaseUrl}/${apiKey}/${pathname}`);

  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  return url;
}

async function theSportsDbFetch<T>(
  pathname: string,
  searchParams?: Record<string, string>,
) {
  const response = await fetch(buildUrl(pathname, searchParams), {
    next: {
      revalidate: 0,
    },
  });

  if (!response.ok) {
    throw new TheSportsDbApiError(
      `TheSportsDB respondió ${response.status}.`,
      response.status,
    );
  }

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw new TheSportsDbApiError(
      "TheSportsDB devolvió una respuesta que no es JSON válido.",
      response.status,
    );
  }

  return data as T;
}

export async function searchTheSportsDbTeams(teamName: string) {
  const data = await theSportsDbFetch<TheSportsDbTeamsResponse>(
    "searchteams.php",
    {
      t: teamName,
    },
  );

  return (data.teams ?? [])
    .map((team) => mapTheSportsDbTeamToAssetCandidate(team))
    .filter((team): team is NonNullable<typeof team> => Boolean(team));
}

export async function lookupTheSportsDbTeam(teamId: string) {
  const data = await theSportsDbFetch<TheSportsDbTeamsResponse>(
    "lookupteam.php",
    {
      id: teamId,
    },
  );

  return data.teams?.[0]
    ? mapTheSportsDbTeamToAssetCandidate(data.teams[0])
    : null;
}

export async function searchTheSportsDbVenues(venueName: string) {
  const data = await theSportsDbFetch<TheSportsDbVenuesResponse>(
    "searchvenues.php",
    {
      v: venueName,
    },
  );

  return (data.venues ?? [])
    .map((venue) => mapTheSportsDbVenueToAssetCandidate(venue))
    .filter((venue): venue is NonNullable<typeof venue> => Boolean(venue));
}

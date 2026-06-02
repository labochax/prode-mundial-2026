import type { Json } from "@/lib/supabase/database.types";

export type OfficialWorldCupStadium = {
  aliases: readonly string[];
  city: string;
  country: string;
  name: string;
};

export type FootballDataStadiumCandidate = {
  city: string | null;
  country: string | null;
  name: string;
  raw_json: Json;
};

export const officialWorldCupStadiums = [
  {
    aliases: ["Estadio Azteca"],
    city: "Ciudad de México",
    country: "México",
    name: "Mexico City Stadium",
  },
  {
    aliases: ["Akron Stadium", "Estadio Akron"],
    city: "Guadalajara",
    country: "México",
    name: "Estadio Guadalajara",
  },
  {
    aliases: ["Estadio BBVA"],
    city: "Monterrey",
    country: "México",
    name: "Estadio Monterrey",
  },
  {
    aliases: ["BMO Field"],
    city: "Toronto",
    country: "Canadá",
    name: "Toronto Stadium",
  },
  {
    aliases: ["BC Place"],
    city: "Vancouver",
    country: "Canadá",
    name: "BC Place Vancouver",
  },
  {
    aliases: ["SoFi Stadium"],
    city: "Los Ángeles",
    country: "Estados Unidos",
    name: "Los Angeles Stadium",
  },
  {
    aliases: ["Levi's Stadium", "Levis Stadium"],
    city: "Área de la Bahía de San Francisco",
    country: "Estados Unidos",
    name: "San Francisco Bay Area Stadium",
  },
  {
    aliases: ["Lumen Field"],
    city: "Seattle",
    country: "Estados Unidos",
    name: "Seattle Stadium",
  },
  {
    aliases: ["AT&T Stadium", "ATT Stadium"],
    city: "Dallas",
    country: "Estados Unidos",
    name: "Dallas Stadium",
  },
  {
    aliases: ["NRG Stadium"],
    city: "Houston",
    country: "Estados Unidos",
    name: "Houston Stadium",
  },
  {
    aliases: ["Arrowhead Stadium"],
    city: "Kansas City",
    country: "Estados Unidos",
    name: "Kansas City Stadium",
  },
  {
    aliases: ["Mercedes-Benz Stadium", "Mercedes Benz Stadium"],
    city: "Atlanta",
    country: "Estados Unidos",
    name: "Atlanta Stadium",
  },
  {
    aliases: ["Hard Rock Stadium"],
    city: "Miami",
    country: "Estados Unidos",
    name: "Miami Stadium",
  },
  {
    aliases: ["Gillette Stadium"],
    city: "Boston",
    country: "Estados Unidos",
    name: "Boston Stadium",
  },
  {
    aliases: ["Lincoln Financial Field"],
    city: "Filadelfia",
    country: "Estados Unidos",
    name: "Philadelphia Stadium",
  },
  {
    aliases: ["MetLife Stadium", "Metlife Stadium"],
    city: "Nueva York / Nueva Jersey",
    country: "Estados Unidos",
    name: "New York New Jersey Stadium",
  },
] as const satisfies readonly OfficialWorldCupStadium[];

function isRecord(
  value: Json | null | undefined,
): value is Record<string, Json | undefined> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeVenueName(value: string | null | undefined) {
  return (
    value
      ?.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/['’]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .replace(/\s+/g, " ") ?? ""
  );
}

const stadiumByAlias = new Map(
  officialWorldCupStadiums.flatMap((stadium) =>
    [stadium.name, ...stadium.aliases].map(
      (alias) => [normalizeVenueName(alias), stadium] as const,
    ),
  ),
);

export function getOfficialWorldCupStadium(
  venueName: string | null | undefined,
) {
  return stadiumByAlias.get(normalizeVenueName(venueName)) ?? null;
}

export function getMatchVenueNameFromRawJson(rawJson: Json | null) {
  if (!isRecord(rawJson)) {
    return null;
  }

  const venue = rawJson.venue;

  return typeof venue === "string" && venue.trim().length > 0
    ? venue.trim()
    : null;
}

export function mapFootballDataVenueToStadiumCandidate(
  venueName: string | null | undefined,
): FootballDataStadiumCandidate | null {
  const normalizedVenueName = venueName?.trim();

  if (!normalizedVenueName) {
    return null;
  }

  const officialStadium = getOfficialWorldCupStadium(normalizedVenueName);

  return {
    city: officialStadium?.city ?? null,
    country: officialStadium?.country ?? null,
    name: officialStadium?.name ?? normalizedVenueName,
    raw_json: {
      football_data_venue: normalizedVenueName,
      source: "football-data-match-venue",
    },
  };
}

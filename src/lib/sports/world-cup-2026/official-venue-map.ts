import type { Json } from "@/lib/supabase/database.types";

export type OfficialWorldCupVenue = {
  aliases: readonly string[];
  city: string;
  commonName?: string;
  country: "Canada" | "Mexico" | "United States";
  fifaName: string;
  key: string;
};

export type OfficialMatchVenueAssignment = {
  matchNumber: number;
  source: "official-fifa-schedule";
  venueKey: string;
};

export type OfficialWorldCupVenueDiscrepancy = {
  fifaVenue: string;
  footballDataVenue: string;
};

export type OfficialWorldCupVenueResolution = {
  discrepancy: OfficialWorldCupVenueDiscrepancy | null;
  fifaMatchNumber: number | null;
  missingReason: "missing-fifa-match-number" | "missing-fifa-venue" | null;
  source: "football-data-match-venue" | "official-fifa-schedule" | null;
  venue: OfficialWorldCupVenue | null;
};

type MatchVenueLookupInput = {
  footballDataId?: number | null;
  footballDataVenue?: string | null;
  matchNumber?: number | null;
  rawJson?: Json | null;
  stage?: string | null;
};

export const officialWorldCupVenues = [
  {
    aliases: ["Estadio Azteca"],
    city: "Ciudad de México",
    commonName: "Estadio Azteca",
    country: "Mexico",
    fifaName: "Mexico City Stadium",
    key: "mexico-city-stadium",
  },
  {
    aliases: ["Akron Stadium", "Estadio Akron", "Estadio Guadalajara"],
    city: "Guadalajara",
    commonName: "Estadio Akron",
    country: "Mexico",
    fifaName: "Guadalajara Stadium",
    key: "guadalajara-stadium",
  },
  {
    aliases: ["Estadio BBVA", "Estadio Monterrey"],
    city: "Monterrey",
    commonName: "Estadio BBVA",
    country: "Mexico",
    fifaName: "Monterrey Stadium",
    key: "monterrey-stadium",
  },
  {
    aliases: ["BMO Field"],
    city: "Toronto",
    commonName: "BMO Field",
    country: "Canada",
    fifaName: "Toronto Stadium",
    key: "toronto-stadium",
  },
  {
    aliases: ["BC Place"],
    city: "Vancouver",
    commonName: "BC Place",
    country: "Canada",
    fifaName: "BC Place Vancouver",
    key: "bc-place-vancouver",
  },
  {
    aliases: ["SoFi Stadium"],
    city: "Los Ángeles",
    commonName: "SoFi Stadium",
    country: "United States",
    fifaName: "Los Angeles Stadium",
    key: "los-angeles-stadium",
  },
  {
    aliases: ["Levi's Stadium", "Levis Stadium"],
    city: "Área de la Bahía de San Francisco",
    commonName: "Levi's Stadium",
    country: "United States",
    fifaName: "San Francisco Bay Area Stadium",
    key: "san-francisco-bay-area-stadium",
  },
  {
    aliases: ["Lumen Field"],
    city: "Seattle",
    commonName: "Lumen Field",
    country: "United States",
    fifaName: "Seattle Stadium",
    key: "seattle-stadium",
  },
  {
    aliases: ["AT&T Stadium", "ATT Stadium"],
    city: "Dallas",
    commonName: "AT&T Stadium",
    country: "United States",
    fifaName: "Dallas Stadium",
    key: "dallas-stadium",
  },
  {
    aliases: ["NRG Stadium"],
    city: "Houston",
    commonName: "NRG Stadium",
    country: "United States",
    fifaName: "Houston Stadium",
    key: "houston-stadium",
  },
  {
    aliases: ["Arrowhead Stadium"],
    city: "Kansas City",
    commonName: "Arrowhead Stadium",
    country: "United States",
    fifaName: "Kansas City Stadium",
    key: "kansas-city-stadium",
  },
  {
    aliases: ["Mercedes-Benz Stadium", "Mercedes Benz Stadium"],
    city: "Atlanta",
    commonName: "Mercedes-Benz Stadium",
    country: "United States",
    fifaName: "Atlanta Stadium",
    key: "atlanta-stadium",
  },
  {
    aliases: ["Hard Rock Stadium"],
    city: "Miami",
    commonName: "Hard Rock Stadium",
    country: "United States",
    fifaName: "Miami Stadium",
    key: "miami-stadium",
  },
  {
    aliases: ["Gillette Stadium"],
    city: "Boston",
    commonName: "Gillette Stadium",
    country: "United States",
    fifaName: "Boston Stadium",
    key: "boston-stadium",
  },
  {
    aliases: ["Lincoln Financial Field"],
    city: "Filadelfia",
    commonName: "Lincoln Financial Field",
    country: "United States",
    fifaName: "Philadelphia Stadium",
    key: "philadelphia-stadium",
  },
  {
    aliases: ["MetLife Stadium", "Metlife Stadium"],
    city: "Nueva York / Nueva Jersey",
    commonName: "MetLife Stadium",
    country: "United States",
    fifaName: "New York New Jersey Stadium",
    key: "new-york-new-jersey-stadium",
  },
] as const satisfies readonly OfficialWorldCupVenue[];

const matchNumbersByVenueKey = {
  "atlanta-stadium": [14, 25, 38, 50, 72, 80, 95, 102],
  "bc-place-vancouver": [6, 27, 40, 51, 64, 85, 96],
  "boston-stadium": [5, 18, 30, 45, 61, 74, 97],
  "dallas-stadium": [11, 22, 43, 57, 70, 78, 88, 93, 101],
  "guadalajara-stadium": [2, 28, 48, 66],
  "houston-stadium": [10, 23, 35, 47, 65, 76, 90],
  "kansas-city-stadium": [19, 34, 58, 69, 87, 100],
  "los-angeles-stadium": [4, 15, 26, 39, 59, 73, 84, 98],
  "mexico-city-stadium": [1, 24, 53, 79, 92],
  "miami-stadium": [13, 37, 49, 71, 86, 99, 103],
  "monterrey-stadium": [12, 36, 54, 75],
  "new-york-new-jersey-stadium": [7, 17, 41, 56, 67, 77, 91, 104],
  "philadelphia-stadium": [9, 29, 42, 55, 68, 89],
  "san-francisco-bay-area-stadium": [8, 20, 31, 44, 60, 81],
  "seattle-stadium": [16, 32, 52, 63, 82, 94],
  "toronto-stadium": [3, 21, 33, 46, 62, 83],
} as const;

export const officialMatchVenueAssignments = Object.entries(
  matchNumbersByVenueKey,
)
  .flatMap(([venueKey, matchNumbers]) =>
    matchNumbers.map(
      (matchNumber) =>
        ({
          matchNumber,
          source: "official-fifa-schedule",
          venueKey,
        }) satisfies OfficialMatchVenueAssignment,
    ),
  )
  .sort((left, right) => left.matchNumber - right.matchNumber);

// Football-Data exposes matchday rather than the FIFA fixture number for group
// matches. These stable provider IDs correlate the imported WC26 snapshot with
// FIFA's published M1-M104 schedule without guessing from chronology.
export const officialFifaMatchNumberByFootballDataId = {
  537327: 1,
  537328: 2,
  537333: 3,
  537345: 4,
  537340: 5,
  537346: 6,
  537339: 7,
  537334: 8,
  537352: 9,
  537351: 10,
  537357: 11,
  537358: 12,
  537370: 13,
  537369: 14,
  537364: 15,
  537363: 16,
  537391: 17,
  537392: 18,
  537397: 19,
  537398: 20,
  537410: 21,
  537409: 22,
  537403: 23,
  537404: 24,
  537329: 25,
  537335: 26,
  537336: 27,
  537330: 28,
  537341: 29,
  537342: 30,
  537347: 31,
  537348: 32,
  537353: 33,
  537354: 34,
  537359: 35,
  537360: 36,
  537372: 37,
  537371: 38,
  537365: 39,
  537366: 40,
  537394: 41,
  537393: 42,
  537399: 43,
  537400: 44,
  537411: 45,
  537412: 46,
  537405: 47,
  537406: 48,
  537343: 49,
  537344: 50,
  537337: 51,
  537338: 52,
  537331: 53,
  537332: 54,
  537356: 55,
  537355: 56,
  537362: 57,
  537361: 58,
  537349: 59,
  537350: 60,
  537395: 61,
  537396: 62,
  537368: 63,
  537367: 64,
  537374: 65,
  537373: 66,
  537413: 67,
  537414: 68,
  537402: 69,
  537401: 70,
  537407: 71,
  537408: 72,
  537417: 73,
  537415: 74,
  537418: 75,
  537423: 76,
  537416: 77,
  537424: 78,
  537425: 79,
  537426: 80,
  537421: 81,
  537422: 82,
  537419: 83,
  537420: 84,
  537429: 85,
  537427: 86,
  537430: 87,
  537428: 88,
  537375: 89,
  537376: 90,
  537377: 91,
  537378: 92,
  537379: 93,
  537380: 94,
  537381: 95,
  537382: 96,
  537383: 97,
  537384: 98,
  537385: 99,
  537386: 100,
  537387: 101,
  537388: 102,
  537389: 103,
  537390: 104,
} as const satisfies Readonly<Record<number, number>>;

function isRecord(
  value: Json | null | undefined,
): value is Record<string, Json | undefined> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeOfficialVenueName(value: string | null | undefined) {
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

const venueByKey = new Map<string, OfficialWorldCupVenue>(
  officialWorldCupVenues.map((venue) => [venue.key, venue]),
);
const venueByNormalizedName = new Map<string, OfficialWorldCupVenue>(
  officialWorldCupVenues.flatMap((venue) =>
    [venue.fifaName, venue.commonName, ...venue.aliases]
      .filter(Boolean)
      .map((name) => [normalizeOfficialVenueName(name), venue] as const),
  ),
);
const assignmentByMatchNumber = new Map<number, OfficialMatchVenueAssignment>(
  officialMatchVenueAssignments.map((assignment) => [
    assignment.matchNumber,
    assignment,
  ]),
);

export function getOfficialWorldCupVenueByName(
  venueName: string | null | undefined,
) {
  return venueByNormalizedName.get(normalizeOfficialVenueName(venueName)) ?? null;
}

export function getOfficialWorldCupVenueForMatchNumber(
  matchNumber: number | null | undefined,
) {
  if (typeof matchNumber !== "number") {
    return null;
  }

  const assignment = assignmentByMatchNumber.get(matchNumber);

  return assignment ? venueByKey.get(assignment.venueKey) ?? null : null;
}

export function getOfficialFifaMatchNumber({
  footballDataId,
  matchNumber,
  stage,
}: Pick<MatchVenueLookupInput, "footballDataId" | "matchNumber" | "stage">) {
  if (
    typeof footballDataId === "number" &&
    footballDataId in officialFifaMatchNumberByFootballDataId
  ) {
    return officialFifaMatchNumberByFootballDataId[
      footballDataId as keyof typeof officialFifaMatchNumberByFootballDataId
    ];
  }

  if (
    typeof matchNumber !== "number" ||
    !Number.isInteger(matchNumber) ||
    matchNumber < 1 ||
    matchNumber > 104
  ) {
    return null;
  }

  const normalizedStage = stage?.trim().toUpperCase() ?? "";

  if (normalizedStage.includes("GROUP") && matchNumber <= 3) {
    return null;
  }

  return matchNumber;
}

function readFootballDataVenue(input: MatchVenueLookupInput) {
  if (input.footballDataVenue?.trim()) {
    return input.footballDataVenue.trim();
  }

  if (!isRecord(input.rawJson)) {
    return null;
  }

  const venue = input.rawJson.venue;

  return typeof venue === "string" && venue.trim().length > 0
    ? venue.trim()
    : null;
}

export function resolveOfficialWorldCupMatchVenue(
  input: MatchVenueLookupInput,
): OfficialWorldCupVenueResolution {
  const fifaMatchNumber = getOfficialFifaMatchNumber(input);

  if (fifaMatchNumber === null) {
    return {
      discrepancy: null,
      fifaMatchNumber: null,
      missingReason: "missing-fifa-match-number",
      source: null,
      venue: null,
    };
  }

  const fifaVenue = getOfficialWorldCupVenueForMatchNumber(fifaMatchNumber);

  if (!fifaVenue) {
    return {
      discrepancy: null,
      fifaMatchNumber,
      missingReason: "missing-fifa-venue",
      source: null,
      venue: null,
    };
  }

  const footballDataVenueName = readFootballDataVenue(input);
  const footballDataVenue = getOfficialWorldCupVenueByName(footballDataVenueName);

  if (footballDataVenue?.key === fifaVenue.key) {
    return {
      discrepancy: null,
      fifaMatchNumber,
      missingReason: null,
      source: "football-data-match-venue",
      venue: fifaVenue,
    };
  }

  return {
    discrepancy: footballDataVenueName
      ? {
          fifaVenue: fifaVenue.fifaName,
          footballDataVenue: footballDataVenueName,
        }
      : null,
    fifaMatchNumber,
    missingReason: null,
    source: "official-fifa-schedule",
    venue: fifaVenue,
  };
}

export function validateOfficialWorldCupVenueMap() {
  const matchNumbers: number[] = officialMatchVenueAssignments.map(
    (assignment) => assignment.matchNumber,
  );
  const duplicateMatchNumbers = [
    ...new Set(
      matchNumbers.filter(
        (matchNumber, index) => matchNumbers.indexOf(matchNumber) !== index,
      ),
    ),
  ].sort((left, right) => left - right);
  const missingMatchNumbers = Array.from(
    { length: 104 },
    (_, index) => index + 1,
  ).filter((matchNumber) => !matchNumbers.includes(matchNumber));
  const invalidVenueKeys = [
    ...new Set(
      officialMatchVenueAssignments
        .map((assignment) => assignment.venueKey)
        .filter((venueKey) => !venueByKey.has(venueKey)),
    ),
  ].sort();

  return {
    duplicateMatchNumbers,
    invalidVenueKeys,
    missingMatchNumbers,
    valid:
      duplicateMatchNumbers.length === 0 &&
      invalidVenueKeys.length === 0 &&
      missingMatchNumbers.length === 0,
  };
}

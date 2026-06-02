import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

import {
  mapOfficialWorldCupVenueToStadiumCandidate,
  normalizeVenueName,
} from "../src/lib/sports/football-data/stadiums";
import type { Json } from "../src/lib/supabase/database.types";
import {
  validateOfficialWorldCupVenueMap,
  type OfficialWorldCupVenue,
} from "../src/lib/sports/world-cup-2026/official-venue-map";
import {
  buildOfficialStadiumEnrichmentPlan,
  type OfficialStadiumEnrichmentAssignment,
} from "../src/lib/sports/world-cup-2026/stadium-enrichment-plan";

type MatchRow = {
  football_data_id: number | null;
  id: string;
  match_number: number | null;
  raw_json: Json | null;
  stadium_id: string | null;
  stage: string | null;
};

type StadiumRow = {
  city: string | null;
  country: string | null;
  id: string;
  name: string;
  raw_json: Json | null;
};

type StadiumReport = {
  city: string | null;
  country: string | null;
  name: string;
  venueKey: string;
};

type EnrichmentReport = {
  assignedFromFootballDataVenue: number;
  assignedFromOfficialVenueMap: number;
  checkedMatches: number;
  discrepancies: Array<{
    fifaVenue: string;
    footballDataVenue: string;
    matchId: string;
    matchNumber: number;
  }>;
  dryRun: boolean;
  errors: Array<{
    matchId?: string;
    message: string;
  }>;
  linkedMatches: number;
  missingAssignments: Array<{
    footballDataId: number;
    matchId: string;
    matchNumber: number | null;
    reason: "missing-fifa-match-number" | "missing-fifa-venue";
  }>;
  skippedLocalMatches: number;
  stadiums: StadiumReport[];
  stadiumsInserted: number;
  stadiumsUpdated: number;
  timestamp: string;
  updatedMatches: number;
};

function loadEnvFile(filePath: string) {
  let contents: string;

  try {
    contents = readFileSync(filePath, "utf8");
  } catch {
    return;
  }

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex < 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function loadLocalEnv() {
  const cwd = process.cwd();

  loadEnvFile(resolve(cwd, ".env.local"));
  loadEnvFile(resolve(cwd, ".env"));
}

function requireEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Falta configurar ${name} en .env.local o .env.`);
  }

  return value;
}

function writeReport(report: EnrichmentReport) {
  const reportPath = join(
    process.cwd(),
    "reports",
    "football-data-stadium-enrichment-report.json",
  );

  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  return reportPath;
}

function printSummary(report: EnrichmentReport, reportPath: string) {
  const modeLabel = report.dryRun ? "dry-run" : "write";

  console.log(`[WC26 stadium enrichment:${modeLabel}]`);
  console.log(`Partidos oficiales revisados: ${report.checkedMatches}`);
  console.log(
    `Asignados por venue de Football-Data: ${report.assignedFromFootballDataVenue}`,
  );
  console.log(
    `Asignados por mapa oficial FIFA: ${report.assignedFromOfficialVenueMap}`,
  );
  console.log(`Asignaciones faltantes: ${report.missingAssignments.length}`);
  console.log(`Discrepancias Football-Data/FIFA: ${report.discrepancies.length}`);
  console.log(`Estadios detectados: ${report.stadiums.length}`);
  console.log(`Estadios insertados: ${report.dryRun ? 0 : report.stadiumsInserted}`);
  console.log(`Estadios actualizados: ${report.dryRun ? 0 : report.stadiumsUpdated}`);
  console.log(`Partidos actualizados: ${report.dryRun ? 0 : report.updatedMatches}`);
  console.log(`Errores: ${report.errors.length}`);

  if (report.missingAssignments.length > 0) {
    console.log(
      `Match numbers faltantes: ${report.missingAssignments
        .map((match) => match.matchNumber ?? "sin match_number")
        .join(", ")}`,
    );
  }

  for (const discrepancy of report.discrepancies) {
    console.log(
      `Discrepancia M${discrepancy.matchNumber}: Football-Data="${discrepancy.footballDataVenue}" FIFA="${discrepancy.fifaVenue}"`,
    );
  }

  console.log(`Reporte: ${reportPath}`);
}

function sortJsonValue(value: Json | null): Json | null {
  if (Array.isArray(value)) {
    return value.map((item) => sortJsonValue(item)) as Json;
  }

  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
        .map(([key, item]) => [key, sortJsonValue(item ?? null)]),
    ) as Json;
  }

  return value;
}

function areJsonValuesEqual(left: Json | null, right: Json) {
  return JSON.stringify(sortJsonValue(left)) === JSON.stringify(sortJsonValue(right));
}

function getStableStadiumCandidate(venue: OfficialWorldCupVenue) {
  return mapOfficialWorldCupVenueToStadiumCandidate(venue, {
    source: "official-fifa-schedule",
  });
}

function getUniqueVenueAssignments(assignments: OfficialStadiumEnrichmentAssignment[]) {
  return [
    ...new Map(
      assignments.map((assignment) => [assignment.venueKey, assignment]),
    ).values(),
  ];
}

async function main() {
  loadLocalEnv();

  const dryRun = process.argv.includes("--dry-run");
  const validation = validateOfficialWorldCupVenueMap();

  if (!validation.valid) {
    throw new Error(
      `El mapa FIFA WC26 es inválido: ${JSON.stringify(validation)}.`,
    );
  }

  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
  const [{ data: matchData, error: matchError }, { data: stadiumData, error: stadiumError }] =
    await Promise.all([
      supabase
        .from("matches")
        .select("id,football_data_id,match_number,raw_json,stadium_id,stage"),
      supabase.from("stadiums").select("id,name,city,country,raw_json"),
    ]);

  if (matchError) {
    throw new Error(`No pudimos leer partidos desde Supabase: ${matchError.message}`);
  }

  if (stadiumError) {
    throw new Error(`No pudimos leer estadios desde Supabase: ${stadiumError.message}`);
  }

  const matches = (matchData ?? []) as MatchRow[];
  const plan = buildOfficialStadiumEnrichmentPlan(
    matches.map((match) => ({
      footballDataId: match.football_data_id,
      id: match.id,
      matchNumber: match.match_number,
      rawJson: match.raw_json,
      stage: match.stage,
    })),
  );
  const report: EnrichmentReport = {
    assignedFromFootballDataVenue: plan.assignedFromFootballDataVenue,
    assignedFromOfficialVenueMap: plan.assignedFromOfficialVenueMap,
    checkedMatches: plan.checkedMatches,
    discrepancies: plan.discrepancies,
    dryRun,
    errors: [],
    linkedMatches: plan.assignments.length,
    missingAssignments: plan.missingAssignments,
    skippedLocalMatches: plan.skippedLocalMatches,
    stadiums: getUniqueVenueAssignments(plan.assignments).map(
      ({ venue, venueKey }) => ({
        city: venue.city,
        country: venue.country,
        name: venue.fifaName,
        venueKey,
      }),
    ),
    stadiumsInserted: 0,
    stadiumsUpdated: 0,
    timestamp: new Date().toISOString(),
    updatedMatches: 0,
  };
  const reportPath = writeReport(report);

  if (dryRun) {
    printSummary(report, reportPath);
    return;
  }

  if (plan.missingAssignments.length > 0) {
    printSummary(report, reportPath);
    throw new Error(
      "No se escribió ningún cambio porque faltan asignaciones FIFA para partidos oficiales.",
    );
  }

  const stadiumsByName = new Map(
    ((stadiumData ?? []) as StadiumRow[]).map((stadium) => [
      normalizeVenueName(stadium.name),
      stadium,
    ]),
  );
  const resolvedStadiumIdsByKey = new Map<string, string>();

  for (const { venue, venueKey } of getUniqueVenueAssignments(plan.assignments)) {
    const candidate = getStableStadiumCandidate(venue);
    const stadiumKey = normalizeVenueName(candidate.name);
    let stadium = stadiumsByName.get(stadiumKey);

    if (stadium) {
      const requiresUpdate =
        stadium.city !== candidate.city ||
        stadium.country !== candidate.country ||
        stadium.name !== candidate.name ||
        !areJsonValuesEqual(stadium.raw_json, candidate.raw_json);

      if (requiresUpdate) {
        const { error } = await supabase
          .from("stadiums")
          .update(candidate)
          .eq("id", stadium.id);

        if (error) {
          throw error;
        }

        report.stadiumsUpdated += 1;
      }
    } else {
      const { data, error } = await supabase
        .from("stadiums")
        .insert(candidate)
        .select("id,name,city,country,raw_json")
        .single();

      if (error) {
        throw error;
      }

      stadium = data;
      stadiumsByName.set(stadiumKey, stadium);
      report.stadiumsInserted += 1;
    }

    resolvedStadiumIdsByKey.set(venueKey, stadium.id);
  }

  const matchesById = new Map(matches.map((match) => [match.id, match]));

  for (const assignment of plan.assignments) {
    const stadiumId = resolvedStadiumIdsByKey.get(assignment.venueKey);
    const match = matchesById.get(assignment.matchId);

    if (!stadiumId || !match || match.stadium_id === stadiumId) {
      continue;
    }

    const { error } = await supabase
      .from("matches")
      .update({
        stadium_id: stadiumId,
      })
      .eq("id", match.id);

    if (error) {
      throw error;
    }

    report.updatedMatches += 1;
  }

  writeReport(report);
  printSummary(report, reportPath);
}

main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "No pudimos ejecutar el enriquecimiento de estadios.",
  );
  process.exitCode = 1;
});

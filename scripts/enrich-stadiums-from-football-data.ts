import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

import {
  getMatchVenueNameFromRawJson,
  mapFootballDataVenueToStadiumCandidate,
  normalizeVenueName,
} from "../src/lib/sports/football-data/stadiums";
import type { Json } from "../src/lib/supabase/database.types";

type MatchRow = {
  id: string;
  raw_json: Json | null;
  stadium_id: string | null;
};

type StadiumRow = {
  id: string;
  name: string;
};

type StadiumReport = {
  city: string | null;
  country: string | null;
  name: string;
  sourceVenue: string;
};

type EnrichmentReport = {
  checkedMatches: number;
  dryRun: boolean;
  errors: Array<{
    matchId?: string;
    message: string;
  }>;
  linkedMatches: number;
  matchesWithoutVenue: number;
  stadiums: StadiumReport[];
  stadiumsInserted: number;
  stadiumsUpdated: number;
  timestamp: string;
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

async function main() {
  loadLocalEnv();

  const dryRun = process.argv.includes("--dry-run");
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
  const [{ data: matchData, error: matchError }, { data: stadiumData, error: stadiumError }] =
    await Promise.all([
      supabase.from("matches").select("id,raw_json,stadium_id"),
      supabase.from("stadiums").select("id,name"),
    ]);

  if (matchError) {
    throw new Error(`No pudimos leer partidos desde Supabase: ${matchError.message}`);
  }

  if (stadiumError) {
    throw new Error(`No pudimos leer estadios desde Supabase: ${stadiumError.message}`);
  }

  const matches = (matchData ?? []) as MatchRow[];
  const stadiumsByName = new Map(
    ((stadiumData ?? []) as StadiumRow[]).map((stadium) => [
      normalizeVenueName(stadium.name),
      stadium,
    ]),
  );
  const report: EnrichmentReport = {
    checkedMatches: matches.length,
    dryRun,
    errors: [],
    linkedMatches: 0,
    matchesWithoutVenue: 0,
    stadiums: [],
    stadiumsInserted: 0,
    stadiumsUpdated: 0,
    timestamp: new Date().toISOString(),
  };
  const processedVenueKeys = new Set<string>();
  const resolvedStadiumsByKey = new Map<string, StadiumRow>();

  for (const match of matches) {
    const venueName = getMatchVenueNameFromRawJson(match.raw_json);

    if (!venueName) {
      report.matchesWithoutVenue += 1;
      continue;
    }

    const candidate = mapFootballDataVenueToStadiumCandidate(venueName);

    if (!candidate) {
      continue;
    }

    const stadiumKey = normalizeVenueName(candidate.name);
    let stadium =
      resolvedStadiumsByKey.get(stadiumKey) ?? stadiumsByName.get(stadiumKey);

    try {
      if (!processedVenueKeys.has(stadiumKey)) {
        report.stadiums.push({
          city: candidate.city,
          country: candidate.country,
          name: candidate.name,
          sourceVenue: venueName,
        });
        processedVenueKeys.add(stadiumKey);
      }

      if (!dryRun) {
        if (!resolvedStadiumsByKey.has(stadiumKey) && stadium) {
          const { error } = await supabase
            .from("stadiums")
            .update(candidate)
            .eq("id", stadium.id);

          if (error) {
            throw error;
          }

          report.stadiumsUpdated += 1;
        } else if (!stadium) {
          const { data, error } = await supabase
            .from("stadiums")
            .insert(candidate)
            .select("id,name")
            .single();

          if (error) {
            throw error;
          }

          stadium = data;
          stadiumsByName.set(stadiumKey, stadium);
          report.stadiumsInserted += 1;
        }

        resolvedStadiumsByKey.set(stadiumKey, stadium);

        if (match.stadium_id !== stadium.id) {
          const { error } = await supabase
            .from("matches")
            .update({
              stadium_id: stadium.id,
            })
            .eq("id", match.id);

          if (error) {
            throw error;
          }
        }
      }

      report.linkedMatches += 1;
    } catch (error) {
      report.errors.push({
        matchId: match.id,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const reportPath = writeReport(report);
  const modeLabel = dryRun ? "dry-run" : "write";

  console.log(`[Football-Data stadium enrichment:${modeLabel}]`);
  console.log(`Partidos revisados: ${report.checkedMatches}`);
  console.log(`Partidos con venue vinculable: ${report.linkedMatches}`);
  console.log(`Partidos sin venue real en raw_json: ${report.matchesWithoutVenue}`);
  console.log(`Estadios detectados: ${report.stadiums.length}`);
  console.log(`Estadios insertados: ${dryRun ? 0 : report.stadiumsInserted}`);
  console.log(`Estadios actualizados: ${dryRun ? 0 : report.stadiumsUpdated}`);
  console.log(`Errores: ${report.errors.length}`);
  console.log(`Reporte: ${reportPath}`);

  if (report.errors.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "No pudimos ejecutar el enriquecimiento de estadios.",
  );
  process.exitCode = 1;
});

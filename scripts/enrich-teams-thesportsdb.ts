import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

import {
  chooseBestTeamCandidate,
  getTeamSearchNames,
  normalizeTeamNameForMatch,
} from "../src/lib/sports/team-name-aliases";
import {
  chooseLeagueTeamLinkForSearchNames,
  extractMainTeamAssetsFromHtml,
  extractTheSportsDbLeagueTeamLinks,
  type TheSportsDbLeagueTeamLink,
} from "../src/lib/sports/thesportsdb/public-pages";
import { mapTheSportsDbTeamToAssetCandidate } from "../src/lib/sports/thesportsdb/mappers";
import type {
  TheSportsDbTeam,
  TheSportsDbTeamAssetCandidate,
  TheSportsDbTeamsResponse,
} from "../src/lib/sports/thesportsdb/types";

type TeamRow = {
  badge_url: string | null;
  fanart_url?: string | null;
  id: string;
  jersey_url?: string | null;
  logo_url?: string | null;
  name_en: string | null;
  name_es: string | null;
  short_name: string | null;
  sportsdb_id: string | null;
  team_aliases?: string[] | null;
  tla: string | null;
};

type MatchedTeamReport = {
  badge_url: string | null;
  candidateSportsDbId: string;
  candidateTeamName: string;
  fanart_url: string | null;
  id: string;
  jersey_url: string | null;
  logo_url: string | null;
  matchedBy: string;
  name: string;
  searchNames: string[];
  source: "api" | "league-page";
  teamPageUrl?: string;
  updatedFields: string[];
};

type UnmatchedTeamReport = {
  id: string;
  name: string;
  reason: string;
  searchNames: string[];
};

type AmbiguousTeamReport = {
  candidates: Array<{
    sportsdbId: string;
    teamName: string;
  }>;
  id: string;
  name: string;
  reason: string;
  searchNames: string[];
};

type EnrichmentReport = {
  ambiguousTeams: AmbiguousTeamReport[];
  checkedTeams: number;
  dryRun: boolean;
  errors: Array<{
    id: string;
    message: string;
    name: string;
  }>;
  matchedTeams: MatchedTeamReport[];
  timestamp: string;
  unmatchedTeams: UnmatchedTeamReport[];
  updatedFieldsCount: number;
  updatedTeams: number;
};

const theSportsDbBaseUrl = "https://www.thesportsdb.com/api/v1/json";
const theSportsDbWorldCupLeagueUrl =
  "https://www.thesportsdb.com/league/4429-fifa-world-cup";

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

function uniqueByNormalizedName(names: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const name of names) {
    const normalized = normalizeTeamNameForMatch(name);

    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    result.push(name.trim());
  }

  return result;
}

function getTeamDisplayName(team: TeamRow) {
  return team.name_en ?? team.name_es ?? team.short_name ?? team.tla ?? team.id;
}

function buildTeamSearchNames(team: TeamRow) {
  const baseNames = [
    team.name_en,
    team.name_es,
    team.short_name,
    team.tla,
    ...(team.team_aliases ?? []),
  ].filter((value): value is string => Boolean(value?.trim()));

  return uniqueByNormalizedName(
    baseNames.flatMap((name) => getTeamSearchNames(name)),
  );
}

function uniqueCandidates(candidates: TheSportsDbTeamAssetCandidate[]) {
  const byId = new Map<string, TheSportsDbTeamAssetCandidate>();

  for (const candidate of candidates) {
    byId.set(candidate.sportsdb_id, candidate);
  }

  return Array.from(byId.values());
}

async function fetchTeamCandidates(apiKey: string, teamName: string) {
  const url = new URL(`${theSportsDbBaseUrl}/${apiKey}/searchteams.php`);
  url.searchParams.set("t", teamName);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`TheSportsDB respondió ${response.status} para ${teamName}.`);
  }

  const data = (await response.json()) as TheSportsDbTeamsResponse;

  return (data.teams ?? [])
    .filter((team): team is TheSportsDbTeam => Boolean(team))
    .map((team) => mapTheSportsDbTeamToAssetCandidate(team))
    .filter((team): team is TheSportsDbTeamAssetCandidate => Boolean(team));
}

async function fetchText(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`TheSportsDB respondió ${response.status} para ${url}.`);
  }

  return response.text();
}

function sleep(ms: number) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

function readRequestDelayMs() {
  const rawValue = process.env.THESPORTSDB_REQUEST_DELAY_MS?.trim();

  if (!rawValue) {
    return 2100;
  }

  const value = Number(rawValue);

  return Number.isFinite(value) && value >= 0 ? value : 2100;
}

function hasUsefulAssets(candidate: TheSportsDbTeamAssetCandidate) {
  return Boolean(
    candidate.badge_url ||
      candidate.logo_url ||
      candidate.jersey_url ||
      candidate.fanart_url,
  );
}

function buildLeaguePageCandidate(
  link: TheSportsDbLeagueTeamLink,
  teamPageHtml: string,
): TheSportsDbTeamAssetCandidate {
  const assets = extractMainTeamAssetsFromHtml(teamPageHtml);

  return {
    ...assets,
    flag_url: null,
    raw_json: JSON.parse(
      JSON.stringify({
        assets,
        source: "league-page",
        teamPageUrl: link.url,
      }),
    ),
    sportsdb_id: link.sportsdb_id,
    team_name: link.slug,
  };
}

async function findLeaguePageCandidate(
  team: TeamRow,
  searchNames: string[],
  leagueLinks: readonly TheSportsDbLeagueTeamLink[],
  requestDelayMs: number,
) {
  const link = chooseLeagueTeamLinkForSearchNames(searchNames, leagueLinks);

  if (!link) {
    return {
      reason: `No hubo link publico de TheSportsDB para ${getTeamDisplayName(team)}.`,
      status: "no_match" as const,
    };
  }

  if (requestDelayMs > 0) {
    await sleep(requestDelayMs);
  }

  const teamPageHtml = await fetchText(link.url);
  const candidate = buildLeaguePageCandidate(link, teamPageHtml);

  return {
    candidate,
    matchedBy: link.slug,
    source: "league-page" as const,
    status: "matched" as const,
    teamPageUrl: link.url,
  };
}

async function findBestCandidate(
  apiKey: string,
  team: TeamRow,
  searchNames: string[],
  requestDelayMs: number,
) {
  const allCandidates: TheSportsDbTeamAssetCandidate[] = [];

  for (let index = 0; index < searchNames.length; index += 1) {
    const searchName = searchNames[index];

    if (index > 0 && requestDelayMs > 0) {
      await sleep(requestDelayMs);
    }

    allCandidates.push(...(await fetchTeamCandidates(apiKey, searchName)));

    const candidates = uniqueCandidates(allCandidates);
    const result = chooseBestTeamCandidate(searchName, candidates);

    if (result.status === "matched") {
      return result;
    }
  }

  const candidates = uniqueCandidates(allCandidates);

  for (const searchName of searchNames) {
    const result = chooseBestTeamCandidate(searchName, candidates);

    if (result.status === "matched" || result.status === "ambiguous") {
      return result;
    }
  }

  return {
    reason: `No hubo coincidencias normalizadas para ${getTeamDisplayName(team)}.`,
    status: "no_match" as const,
  };
}

async function findBestApiCandidate(
  apiKey: string,
  team: TeamRow,
  searchNames: string[],
  requestDelayMs: number,
) {
  const result = await findBestCandidate(apiKey, team, searchNames, requestDelayMs);

  if (result.status === "matched") {
    return {
      ...result,
      source: "api" as const,
    };
  }

  return result;
}

function getUpdatedFields(
  team: TeamRow,
  candidate: TheSportsDbTeamAssetCandidate,
) {
  const changedFields: string[] = [];
  const checks = [
    ["sportsdb_id", team.sportsdb_id, candidate.sportsdb_id],
    ["badge_url", team.badge_url, candidate.badge_url],
    ["logo_url", team.logo_url ?? null, candidate.logo_url],
    ["jersey_url", team.jersey_url ?? null, candidate.jersey_url],
    ["fanart_url", team.fanart_url ?? null, candidate.fanart_url],
  ] as const;

  for (const [field, currentValue, nextValue] of checks) {
    if (nextValue && currentValue !== nextValue) {
      changedFields.push(field);
    }
  }

  return changedFields;
}

function writeReport(report: EnrichmentReport) {
  const reportPath = join(
    process.cwd(),
    "reports",
    "thesportsdb-team-enrichment-report.json",
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
  const apiKey = process.env.THESPORTSDB_API_KEY?.trim() || "123";
  const requestDelayMs = readRequestDelayMs();
  let leagueLinks: TheSportsDbLeagueTeamLink[] = [];

  try {
    const leagueHtml = await fetchText(theSportsDbWorldCupLeagueUrl);
    leagueLinks = extractTheSportsDbLeagueTeamLinks(leagueHtml);
  } catch (error) {
    console.warn(
      error instanceof Error
        ? error.message
        : "No pudimos leer la pagina publica del Mundial en TheSportsDB.",
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
  const { data, error } = await supabase
    .from("teams")
    .select(
      "id,name_es,name_en,short_name,tla,sportsdb_id,badge_url,logo_url,jersey_url,fanart_url,team_aliases",
    )
    .order("name_en", { ascending: true });

  if (error) {
    throw new Error(`No pudimos leer equipos desde Supabase: ${error.message}`);
  }

  const teams = (data ?? []) as TeamRow[];
  const timestamp = new Date().toISOString();
  const report: EnrichmentReport = {
    ambiguousTeams: [],
    checkedTeams: teams.length,
    dryRun,
    errors: [],
    matchedTeams: [],
    timestamp,
    unmatchedTeams: [],
    updatedFieldsCount: 0,
    updatedTeams: 0,
  };

  for (const team of teams) {
    const name = getTeamDisplayName(team);
    const searchNames = buildTeamSearchNames(team);

    try {
      const leagueResult =
        leagueLinks.length > 0
          ? await findLeaguePageCandidate(
              team,
              searchNames,
              leagueLinks,
              requestDelayMs,
            )
          : {
              reason: "No se pudo cargar la pagina publica de la liga.",
              status: "no_match" as const,
            };
      const result =
        leagueResult.status === "matched" && hasUsefulAssets(leagueResult.candidate)
          ? leagueResult
          : await findBestApiCandidate(apiKey, team, searchNames, requestDelayMs);

      if (result.status === "no_match") {
        report.unmatchedTeams.push({
          id: team.id,
          name,
          reason: result.reason,
          searchNames,
        });
        continue;
      }

      if (result.status === "ambiguous") {
        report.ambiguousTeams.push({
          candidates: result.candidates.map((candidate) => ({
            sportsdbId: candidate.sportsdb_id,
            teamName: candidate.team_name,
          })),
          id: team.id,
          name,
          reason: result.reason,
          searchNames,
        });
        continue;
      }

      const candidate = result.candidate;
      const updatedFields = getUpdatedFields(team, candidate);

      report.matchedTeams.push({
        badge_url: candidate.badge_url,
        candidateSportsDbId: candidate.sportsdb_id,
        candidateTeamName: candidate.team_name,
        fanart_url: candidate.fanart_url,
        id: team.id,
        jersey_url: candidate.jersey_url,
        logo_url: candidate.logo_url,
        matchedBy: result.matchedBy,
        name,
        searchNames,
        source: result.source,
        teamPageUrl:
          result.source === "league-page" ? result.teamPageUrl : undefined,
        updatedFields,
      });
      report.updatedFieldsCount += updatedFields.length;

      if (!dryRun && updatedFields.length > 0) {
        const { error: updateError } = await supabase
          .from("teams")
          .update({
            assets_last_synced_at: timestamp,
            badge_url: candidate.badge_url,
            fanart_url: candidate.fanart_url,
            jersey_url: candidate.jersey_url,
            logo_url: candidate.logo_url,
            sportsdb_id: candidate.sportsdb_id,
            thesportsdb_raw_json: candidate.raw_json,
          })
          .eq("id", team.id);

        if (updateError) {
          throw new Error(updateError.message);
        }

        report.updatedTeams += 1;
      }
    } catch (error) {
      report.errors.push({
        id: team.id,
        message: error instanceof Error ? error.message : String(error),
        name,
      });
    }
  }

  const reportPath = writeReport(report);
  const modeLabel = dryRun ? "dry-run" : "write";

  console.log(`[TheSportsDB team enrichment:${modeLabel}]`);
  console.log(`Equipos revisados: ${report.checkedTeams}`);
  console.log(`Coincidencias: ${report.matchedTeams.length}`);
  console.log(`Actualizados: ${dryRun ? 0 : report.updatedTeams}`);
  console.log(`Sin coincidencia: ${report.unmatchedTeams.length}`);
  console.log(`Ambiguos: ${report.ambiguousTeams.length}`);
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
      : "No pudimos ejecutar el enriquecimiento de equipos.",
  );
  process.exitCode = 1;
});

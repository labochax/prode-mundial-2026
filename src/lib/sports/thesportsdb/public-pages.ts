import {
  getTeamSearchNames,
  normalizeTeamNameForMatch,
} from "../team-name-aliases";

export type TheSportsDbLeagueTeamLink = {
  normalizedSlug: string;
  slug: string;
  sportsdb_id: string;
  url: string;
};

export type TheSportsDbPublicTeamAssets = {
  badge_url: string | null;
  fanart_url: string | null;
  jersey_url: string | null;
  logo_url: string | null;
};

type ImageCandidate = {
  alt: string;
  src: string;
};

const publicBaseUrl = "https://www.thesportsdb.com";

function decodeHtmlAttribute(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function decodeSlug(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizeSlug(value: string) {
  return normalizeTeamNameForMatch(decodeSlug(value).replace(/-/g, " "));
}

function absoluteTheSportsDbUrl(value: string) {
  if (value.startsWith("//")) {
    return `https:${value}`;
  }

  if (value.startsWith("/")) {
    return `${publicBaseUrl}${value}`;
  }

  return value;
}

export function extractTheSportsDbLeagueTeamLinks(html: string) {
  const linkRegex =
    /href=["'](?:https:\/\/www\.thesportsdb\.com)?\/team\/(\d+)-([^"'?#]+)[^"']*["']/gi;
  const linksById = new Map<string, TheSportsDbLeagueTeamLink>();

  for (const match of html.matchAll(linkRegex)) {
    const sportsdbId = match[1];
    const slug = decodeSlug(match[2]);

    linksById.set(sportsdbId, {
      normalizedSlug: normalizeSlug(slug),
      slug,
      sportsdb_id: sportsdbId,
      url: `${publicBaseUrl}/team/${sportsdbId}-${match[2]}`,
    });
  }

  return Array.from(linksById.values());
}

export function chooseLeagueTeamLinkForSearchNames(
  searchNames: string[],
  links: readonly TheSportsDbLeagueTeamLink[],
) {
  const normalizedNames = new Set(
    searchNames
      .flatMap((name) => getTeamSearchNames(name))
      .map((name) => normalizeTeamNameForMatch(name)),
  );

  return (
    links.find((link) => normalizedNames.has(link.normalizedSlug)) ?? null
  );
}

function readAttributes(tag: string) {
  const attrs = new Map<string, string>();
  const attrRegex = /([a-zA-Z0-9_:-]+)\s*=\s*(["'])(.*?)\2/g;

  for (const match of tag.matchAll(attrRegex)) {
    attrs.set(match[1].toLowerCase(), decodeHtmlAttribute(match[3].trim()));
  }

  return attrs;
}

function extractImageCandidates(html: string) {
  const imgRegex = /<img\b[^>]*>/gi;
  const candidates: ImageCandidate[] = [];

  for (const match of html.matchAll(imgRegex)) {
    const attrs = readAttributes(match[0]);
    const src =
      attrs.get("src") ??
      attrs.get("data-src") ??
      attrs.get("data-original") ??
      attrs.get("data-lazy-src");

    if (!src) {
      continue;
    }

    candidates.push({
      alt: attrs.get("alt") ?? "",
      src: absoluteTheSportsDbUrl(src),
    });
  }

  return candidates;
}

function isTinyOpponentImage(candidate: ImageCandidate) {
  const normalizedAlt = normalizeTeamNameForMatch(candidate.alt);
  const normalizedSrc = candidate.src.toLowerCase();

  return (
    normalizedSrc.endsWith("/tiny") ||
    normalizedAlt === "tiny home badge icon" ||
    normalizedAlt === "tiny away badge icon"
  );
}

function chooseImage(
  candidates: ImageCandidate[],
  predicate: (candidate: ImageCandidate) => boolean,
  preferredPredicate?: (candidate: ImageCandidate) => boolean,
) {
  const matches = candidates.filter(
    (candidate) => !isTinyOpponentImage(candidate) && predicate(candidate),
  );

  return (
    matches.find((candidate) => preferredPredicate?.(candidate)) ??
    matches[0] ??
    null
  );
}

export function extractMainTeamAssetsFromHtml(
  html: string,
): TheSportsDbPublicTeamAssets {
  const candidates = extractImageCandidates(html);
  const badge = chooseImage(
    candidates,
    (candidate) =>
      normalizeTeamNameForMatch(candidate.alt).includes("team badge") ||
      candidate.src.includes("/team/badge/"),
    (candidate) => candidate.src.includes("/team/badge/"),
  );
  const logo = chooseImage(
    candidates,
    (candidate) =>
      normalizeTeamNameForMatch(candidate.alt).includes("team logo") ||
      candidate.src.includes("/team/logo/"),
    (candidate) => candidate.src.includes("/team/logo/"),
  );
  const jersey = chooseImage(candidates, (candidate) =>
    candidate.src.includes("/team/equipment/"),
  );
  const fanart = chooseImage(candidates, (candidate) =>
    candidate.src.includes("/team/fanart/") ||
    candidate.src.includes("/team/banner/"),
  );

  return {
    badge_url: badge?.src ?? null,
    fanart_url: fanart?.src ?? null,
    jersey_url: jersey?.src ?? null,
    logo_url: logo?.src ?? null,
  };
}

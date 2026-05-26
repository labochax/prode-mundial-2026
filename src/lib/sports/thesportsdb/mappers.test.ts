import { describe, expect, it } from "vitest";

import { mapTheSportsDbTeamToAssetCandidate } from "./mappers";

describe("mapTheSportsDbTeamToAssetCandidate", () => {
  it("maps TheSportsDB team artwork into enrichment fields", () => {
    const result = mapTheSportsDbTeamToAssetCandidate({
      idTeam: "1234",
      strFanart1: "https://cdn.example/fanart.jpg",
      strLogo: "https://cdn.example/legacy-logo.png",
      strTeam: "Argentina",
      strTeamBadge: "https://cdn.example/badge.png",
      strTeamJersey: "https://cdn.example/jersey.png",
      strTeamLogo: "https://cdn.example/logo.png",
    });

    expect(result).toMatchObject({
      badge_url: "https://cdn.example/badge.png",
      fanart_url: "https://cdn.example/fanart.jpg",
      flag_url: "https://cdn.example/legacy-logo.png",
      jersey_url: "https://cdn.example/jersey.png",
      logo_url: "https://cdn.example/logo.png",
      sportsdb_id: "1234",
      team_name: "Argentina",
    });
  });

  it("returns null without provider id or team name", () => {
    expect(mapTheSportsDbTeamToAssetCandidate({ strTeam: "Argentina" })).toBeNull();
    expect(mapTheSportsDbTeamToAssetCandidate({ idTeam: "1234" })).toBeNull();
  });
});

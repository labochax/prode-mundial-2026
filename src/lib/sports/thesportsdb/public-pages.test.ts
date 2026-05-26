import { describe, expect, it } from "vitest";

import {
  chooseLeagueTeamLinkForSearchNames,
  extractMainTeamAssetsFromHtml,
  extractTheSportsDbLeagueTeamLinks,
} from "./public-pages";

function buildLeagueHtml(count: number) {
  return Array.from(
    { length: count },
    (_, index) =>
      `<a href="https://www.thesportsdb.com/team/${100000 + index}-team-${index}">Team ${index}</a>`,
  ).join("\n");
}

describe("extractTheSportsDbLeagueTeamLinks", () => {
  it("extracts 48 public team links from league HTML", () => {
    const links = extractTheSportsDbLeagueTeamLinks(buildLeagueHtml(48));

    expect(links).toHaveLength(48);
    expect(links[0]).toMatchObject({
      slug: "team-0",
      sportsdb_id: "100000",
      url: "https://www.thesportsdb.com/team/100000-team-0",
    });
  });

  it("decodes URL-encoded slugs for matching", () => {
    const [link] = extractTheSportsDbLeagueTeamLinks(
      '<a href="/team/134999-cura%C3%A7ao">Curacao</a>',
    );

    expect(link.slug).toBe("curaçao");
    expect(link.normalizedSlug).toBe("curacao");
  });
});

describe("chooseLeagueTeamLinkForSearchNames", () => {
  const links = extractTheSportsDbLeagueTeamLinks(`
    <a href="/team/134509-argentina">Argentina</a>
    <a href="/team/134123-usa">USA</a>
    <a href="/team/134321-czech-republic">Czech Republic</a>
    <a href="/team/134222-dr-congo">DR Congo</a>
    <a href="/team/134333-cura%C3%A7ao">Curacao</a>
    <a href="/team/134444-cape-verde">Cape Verde</a>
  `);

  it("matches local team names and aliases to league slugs", () => {
    expect(
      chooseLeagueTeamLinkForSearchNames(["United States"], links),
    ).toMatchObject({
      slug: "usa",
      sportsdb_id: "134123",
    });
    expect(chooseLeagueTeamLinkForSearchNames(["Czechia"], links)).toMatchObject({
      slug: "czech-republic",
      sportsdb_id: "134321",
    });
    expect(chooseLeagueTeamLinkForSearchNames(["Congo DR"], links)).toMatchObject({
      slug: "dr-congo",
      sportsdb_id: "134222",
    });
    expect(chooseLeagueTeamLinkForSearchNames(["Curaçao"], links)).toMatchObject({
      slug: "curaçao",
      sportsdb_id: "134333",
    });
    expect(
      chooseLeagueTeamLinkForSearchNames(["Cape Verde Islands"], links),
    ).toMatchObject({
      slug: "cape-verde",
      sportsdb_id: "134444",
    });
  });
});

describe("extractMainTeamAssetsFromHtml", () => {
  it("extracts main badge/logo/equipment/fanart while ignoring tiny opponent badges", () => {
    const assets = extractMainTeamAssetsFromHtml(`
      <img alt="tiny home badge icon" src="https://www.thesportsdb.com/images/media/team/badge/opponent/tiny">
      <img alt="team badge" src="https://www.thesportsdb.com/images/media/team/badge/argentina.png">
      <img alt="Team Logo" src="https://www.thesportsdb.com/images/media/team/logo/argentina.png/medium">
      <img alt="Argentina equipment" src="https://www.thesportsdb.com/images/media/team/equipment/argentina.png">
      <img alt="Argentina fanart" src="https://www.thesportsdb.com/images/media/team/fanart/argentina.jpg">
    `);

    expect(assets).toEqual({
      badge_url: "https://www.thesportsdb.com/images/media/team/badge/argentina.png",
      fanart_url: "https://www.thesportsdb.com/images/media/team/fanart/argentina.jpg",
      jersey_url: "https://www.thesportsdb.com/images/media/team/equipment/argentina.png",
      logo_url: "https://www.thesportsdb.com/images/media/team/logo/argentina.png/medium",
    });
  });

  it("handles Spain-style HTML with lazy image attributes", () => {
    const assets = extractMainTeamAssetsFromHtml(`
      <img alt="team badge" data-src="https://www.thesportsdb.com/images/media/team/badge/spain.png/small">
      <img alt="team logo" data-original="https://www.thesportsdb.com/images/media/team/logo/spain.png">
      <img alt="equipment" src="https://www.thesportsdb.com/images/media/team/equipment/spain.png">
    `);

    expect(assets.badge_url).toBe(
      "https://www.thesportsdb.com/images/media/team/badge/spain.png/small",
    );
    expect(assets.logo_url).toBe(
      "https://www.thesportsdb.com/images/media/team/logo/spain.png",
    );
    expect(assets.jersey_url).toBe(
      "https://www.thesportsdb.com/images/media/team/equipment/spain.png",
    );
  });
});

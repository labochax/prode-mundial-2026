import { describe, expect, it } from "vitest";

import {
  chooseBestTeamCandidate,
  getTeamSearchNames,
  normalizeTeamNameForMatch,
} from "@/lib/sports/team-name-aliases";

describe("normalizeTeamNameForMatch", () => {
  it("normalizes case, accents, punctuation and repeated whitespace", () => {
    expect(normalizeTeamNameForMatch("  Côte   d'Ivoire!! ")).toBe(
      "cote d ivoire",
    );
    expect(normalizeTeamNameForMatch("SAN ANDRÉS")).toBe("san andres");
  });
});

describe("getTeamSearchNames", () => {
  it("includes canonical aliases without duplicating normalized values", () => {
    expect(getTeamSearchNames("Korea Republic")).toEqual([
      "Korea Republic",
      "South Korea",
    ]);
    expect(getTeamSearchNames("USA")).toEqual([
      "USA",
      "United States",
      "United States of America",
    ]);
    expect(getTeamSearchNames("Bosnia-Herzegovina")).toEqual([
      "Bosnia-Herzegovina",
      "Bosnia and Herzegovina",
    ]);
    expect(getTeamSearchNames("Congo DR")).toEqual([
      "Congo DR",
      "DR Congo",
      "Democratic Republic of the Congo",
    ]);
  });
});

describe("chooseBestTeamCandidate", () => {
  const candidates = [
    {
      sportsdb_id: "1",
      team_name: "South Korea",
    },
    {
      sportsdb_id: "2",
      team_name: "Korea Republic Women",
    },
  ];

  it("chooses an alias match when provider names differ", () => {
    expect(chooseBestTeamCandidate("Korea Republic", candidates)).toMatchObject({
      candidate: {
        sportsdb_id: "1",
        team_name: "South Korea",
      },
      status: "matched",
    });
  });

  it("returns no_match when candidates do not normalize to the team or aliases", () => {
    expect(chooseBestTeamCandidate("Argentina", candidates)).toEqual({
      reason: "No normalized candidate matched Argentina.",
      status: "no_match",
    });
  });

  it("returns ambiguous when more than one candidate matches", () => {
    expect(
      chooseBestTeamCandidate("South Korea", [
        {
          sportsdb_id: "1",
          team_name: "South Korea",
        },
        {
          sportsdb_id: "2",
          team_name: "South Korea",
        },
      ]),
    ).toMatchObject({
      candidates: [
        {
          sportsdb_id: "1",
        },
        {
          sportsdb_id: "2",
        },
      ],
      status: "ambiguous",
    });
  });
});

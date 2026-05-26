import { describe, expect, it } from "vitest";

import {
  deriveActualTournamentOutcome,
  type ActualTournamentMatch,
} from "@/lib/tournament/actual-outcomes";

function match(
  matchNumber: number,
  homeTeamId: string,
  awayTeamId: string,
  winner: "HOME_TEAM" | "AWAY_TEAM" = "HOME_TEAM",
): ActualTournamentMatch {
  return {
    away_score: winner === "AWAY_TEAM" ? 2 : 0,
    away_team_id: awayTeamId,
    home_score: winner === "HOME_TEAM" ? 2 : 0,
    home_team_id: homeTeamId,
    match_number: matchNumber,
    status: "FINISHED",
    winner,
  };
}

describe("deriveActualTournamentOutcome", () => {
  it("derives actual bonus outcome from finished knockout matches", () => {
    const roundOf32 = Array.from({ length: 16 }, (_, index) =>
      match(73 + index, `r32-home-${index + 1}`, `r32-away-${index + 1}`),
    );
    const roundOf16 = Array.from({ length: 8 }, (_, index) =>
      match(89 + index, `r16-home-${index + 1}`, `r16-away-${index + 1}`),
    );
    const quarterfinals = Array.from({ length: 4 }, (_, index) =>
      match(97 + index, `qf-home-${index + 1}`, `qf-away-${index + 1}`),
    );
    const semifinals = [
      match(101, "finalist-1", "third-playoff-1"),
      match(102, "finalist-2", "third-playoff-2", "AWAY_TEAM"),
    ];
    const final = match(104, "champion", "runner-up");
    const thirdPlace = match(103, "third-place", "fourth-place");

    const result = deriveActualTournamentOutcome([
      ...roundOf32,
      ...roundOf16,
      ...quarterfinals,
      ...semifinals,
      thirdPlace,
      final,
    ]);

    expect(result.status).toBe("complete");
    expect(result.outcome.actualRoundOf16TeamIds).toHaveLength(16);
    expect(result.outcome.actualQuarterfinalTeamIds).toHaveLength(8);
    expect(result.outcome.actualSemifinalTeamIds).toHaveLength(4);
    expect(result.outcome.actualChampionTeamId).toBe("champion");
    expect(result.outcome.actualRunnerUpTeamId).toBe("runner-up");
    expect(result.outcome.actualThirdPlaceTeamId).toBe("third-place");
    expect(result.outcome.actualFourthPlaceTeamId).toBe("fourth-place");
  });

  it("returns incomplete status without crashing when knockout results are missing", () => {
    const result = deriveActualTournamentOutcome([
      match(73, "one", "two"),
      match(74, "three", "four"),
    ]);

    expect(result.status).toBe("incomplete");
    expect(result.reason).toContain("16avos");
    expect(result.outcome.actualRoundOf16TeamIds).toHaveLength(2);
  });

  it("ignores unfinished matches for winner extraction", () => {
    const result = deriveActualTournamentOutcome([
      {
        ...match(104, "champion", "runner-up"),
        status: "TIMED",
        winner: null,
      },
    ]);

    expect(result.status).toBe("incomplete");
    expect(result.outcome.actualChampionTeamId).toBeNull();
  });

  it("explains finished knockout fixtures with unresolved team placeholders", () => {
    const result = deriveActualTournamentOutcome([
      {
        ...match(73, "one", "two"),
        away_team_id: null,
      },
    ]);

    expect(result.status).toBe("incomplete");
    expect(result.reason).toContain("M73 no tiene visitante asignado");
  });

  it("assigns FIFA match numbers from knockout stage order when provider rows have no match number", () => {
    const result = deriveActualTournamentOutcome([
      ...Array.from({ length: 16 }, (_, index) => ({
        ...match(0, `r32-home-${index + 1}`, `r32-away-${index + 1}`),
        football_data_id: 537417 + index,
        kickoff_at: `2026-06-${String(28 + index).padStart(2, "0")}T19:00:00Z`,
        match_number: null,
        stage: "LAST_32",
      })),
      ...Array.from({ length: 8 }, (_, index) => ({
        ...match(0, `r16-home-${index + 1}`, `r16-away-${index + 1}`),
        football_data_id: 537376 + index,
        kickoff_at: `2026-07-${String(4 + index).padStart(2, "0")}T19:00:00Z`,
        match_number: null,
        stage: "LAST_16",
      })),
      ...Array.from({ length: 4 }, (_, index) => ({
        ...match(0, `qf-home-${index + 1}`, `qf-away-${index + 1}`),
        football_data_id: 537383 + index,
        kickoff_at: `2026-07-${String(9 + index).padStart(2, "0")}T19:00:00Z`,
        match_number: null,
        stage: "QUARTER_FINALS",
      })),
      {
        ...match(0, "finalist-1", "third-playoff-1"),
        kickoff_at: "2026-07-14T19:00:00Z",
        match_number: null,
        stage: "SEMI_FINALS",
      },
      {
        ...match(0, "finalist-2", "third-playoff-2", "AWAY_TEAM"),
        kickoff_at: "2026-07-15T19:00:00Z",
        match_number: null,
        stage: "SEMI_FINALS",
      },
      {
        ...match(0, "third-place", "fourth-place"),
        kickoff_at: "2026-07-18T21:00:00Z",
        match_number: null,
        stage: "THIRD_PLACE",
      },
      {
        ...match(0, "champion", "runner-up"),
        kickoff_at: "2026-07-19T19:00:00Z",
        match_number: null,
        stage: "FINAL",
      },
    ]);

    expect(result.status).toBe("complete");
    expect(result.outcome.actualRoundOf16TeamIds).toHaveLength(16);
    expect(result.outcome.actualChampionTeamId).toBe("champion");
  });

  it("reports missing team slots with match-number diagnostics", () => {
    const result = deriveActualTournamentOutcome([
      {
        ...match(0, "one", "two"),
        away_team_id: null,
        kickoff_at: "2026-06-28T19:00:00Z",
        match_number: null,
        stage: "LAST_32",
      },
    ]);

    expect(result.status).toBe("incomplete");
    expect(result.reason).toContain("M73 no tiene visitante asignado");
    expect(result.diagnostics.missingAwayTeamMatchNumbers).toContain(73);
  });
});

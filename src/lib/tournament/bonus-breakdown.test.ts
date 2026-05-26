import { describe, expect, it } from "vitest";

import {
  buildTournamentBonusBreakdown,
  getBonusSummarySegments,
  getStageBonusBadgeLabel,
  getStageTeamBonusStatusLabel,
} from "@/lib/tournament/bonus-breakdown";
import type { TournamentBonusPrediction } from "@/lib/tournament/bonus-scoring";

function prediction(): TournamentBonusPrediction {
  return {
    championTeamId: "team-1",
    fourthPlaceTeamId: "team-4",
    quarterfinalTeamIds: ["team-1", "team-2", "team-3", "team-4"],
    roundOf16TeamIds: ["team-1", "team-2", "team-3", "team-4"],
    runnerUpTeamId: "team-2",
    semifinalTeamIds: ["team-1", "team-2"],
    thirdPlaceTeamId: "team-3",
  };
}

describe("buildTournamentBonusBreakdown", () => {
  it("returns pending state when actual outcomes are incomplete", () => {
    const result = buildTournamentBonusBreakdown(prediction(), {
      outcome: {},
      reason: "Faltan resultados completos de 16avos.",
      status: "incomplete",
    });

    expect(result).toEqual({
      message: "Bonus pendiente: faltan resultados oficiales de eliminación.",
      reason: "Faltan resultados completos de 16avos.",
      status: "pending",
    });
  });

  it("returns stage and placement points when outcomes are complete", () => {
    const result = buildTournamentBonusBreakdown(prediction(), {
      outcome: {
        actualChampionTeamId: "team-1",
        actualFourthPlaceTeamId: "other-4",
        actualQuarterfinalTeamIds: ["team-1", "team-4"],
        actualRoundOf16TeamIds: ["team-1", "team-2", "other-3"],
        actualRunnerUpTeamId: "team-2",
        actualSemifinalTeamIds: ["team-1"],
        actualThirdPlaceTeamId: "team-3",
      },
      status: "complete",
    });

    expect(result.status).toBe("complete");

    if (result.status !== "complete") {
      return;
    }

    expect(result.totalPoints).toBe(24);
    expect(result.stages.octavos.items).toEqual([
      { hit: true, points: 1, teamId: "team-1" },
      { hit: true, points: 1, teamId: "team-2" },
      { hit: false, points: 0, teamId: "team-3" },
      { hit: false, points: 0, teamId: "team-4" },
    ]);
    expect(result.stages.cuartos.points).toBe(2);
    expect(result.stages.semifinales.points).toBe(2);
    expect(result.placements.champion).toMatchObject({ hit: true, points: 10 });
    expect(result.placements.runnerUp).toMatchObject({ hit: true, points: 5 });
    expect(result.placements.thirdPlace).toMatchObject({ hit: true, points: 3 });
    expect(result.placements.fourthPlace).toMatchObject({ hit: false, points: 0 });
  });

  it("uses stage-level bonus labels and non-numeric team status labels", () => {
    expect(getStageBonusBadgeLabel(1)).toBe("BONUS +1");
    expect(getStageBonusBadgeLabel(2)).toBe("BONUS +2");
    expect(getStageTeamBonusStatusLabel(true)).toBe("Acertado");
    expect(getStageTeamBonusStatusLabel(false)).toBe("No acertado");
  });

  it("builds obtained bonus summary segments when outcomes are complete", () => {
    const breakdown = buildTournamentBonusBreakdown(prediction(), {
      outcome: {
        actualChampionTeamId: "team-1",
        actualFourthPlaceTeamId: "other-4",
        actualQuarterfinalTeamIds: ["team-1", "team-4"],
        actualRoundOf16TeamIds: ["team-1", "team-2", "other-3"],
        actualRunnerUpTeamId: "team-2",
        actualSemifinalTeamIds: ["team-1"],
        actualThirdPlaceTeamId: "team-3",
      },
      status: "complete",
    });

    const summary = getBonusSummarySegments(breakdown);

    expect(summary.status).toBe("complete");
    expect(summary.total).toEqual({
      earnedPoints: 24,
      label: "Bonus Mi Mundial",
      maxPoints: 52,
    });
    expect(summary.segments.map((segment) => segment.displayValue)).toEqual([
      "2 / 16 pts",
      "2 / 8 pts",
      "2 / 8 pts",
      "10 / 10 pts",
      "5 / 5 pts",
      "3 / 3 pts",
      "0 / 2 pts",
    ]);
  });

  it("keeps max bonus labels instead of false zeroes while outcomes are pending", () => {
    const summary = getBonusSummarySegments({
      message: "Bonus pendiente: faltan resultados oficiales de eliminación.",
      reason: "Faltan resultados completos de 16avos.",
      status: "pending",
    });

    expect(summary.status).toBe("pending");
    expect(summary.total).toBeNull();
    expect(summary.segments[0]).toMatchObject({
      displayValue: "+1 por equipo / 16 pts",
      earnedPoints: null,
      label: "Equipos en octavos",
      maxPoints: 16,
    });
  });
});

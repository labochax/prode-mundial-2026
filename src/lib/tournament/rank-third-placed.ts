import { rankTournamentStandingRows } from "@/lib/tournament/simulate-groups";
import type {
  RankedThirdPlacedTeam,
  TournamentGroupSimulation,
  TournamentStandingRow,
} from "@/lib/tournament/types";

type ThirdPlacedCandidate = TournamentStandingRow & {
  groupCode: string;
  groupLabel: string;
};

export function rankThirdPlacedTeams(
  groups: TournamentGroupSimulation[],
): RankedThirdPlacedTeam[] {
  const candidates = groups
    .map((group) => {
      const thirdPlaced = group.rows[2];

      if (!thirdPlaced) {
        return null;
      }

      return {
        ...thirdPlaced,
        groupCode: group.groupCode,
        groupLabel: group.groupLabel,
      } satisfies ThirdPlacedCandidate;
    })
    .filter((candidate): candidate is ThirdPlacedCandidate => Boolean(candidate));
  const rankedCandidates = rankTournamentStandingRows(candidates);

  return rankedCandidates.map((candidate, index) => ({
    ...candidate,
    isQualified: index < 8,
    thirdRank: index + 1,
  }));
}

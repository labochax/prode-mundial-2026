export type TournamentTeam = {
  code: string | null;
  id: string;
  name: string;
};

export type TournamentPrediction = {
  awayScore: number;
  homeScore: number;
};

export type TournamentGroupMatch = {
  awayTeam: TournamentTeam;
  groupCode: string;
  homeTeam: TournamentTeam;
  id: string;
  prediction: TournamentPrediction | null;
};

export type TournamentStandingRow = {
  draws: number;
  goalDifference: number;
  goalsAgainst: number;
  goalsFor: number;
  losses: number;
  played: number;
  points: number;
  rank: number;
  team: TournamentTeam;
  wins: number;
};

export type TournamentGroupSimulation = {
  groupCode: string;
  groupLabel: string;
  isComplete: boolean;
  predictionsCompleted: number;
  predictionsTotal: number;
  rows: TournamentStandingRow[];
};

export type RankedThirdPlacedTeam = TournamentStandingRow & {
  groupCode: string;
  groupLabel: string;
  isQualified: boolean;
  thirdRank: number;
};

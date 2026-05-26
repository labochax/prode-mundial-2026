export type TournamentTeam = {
  badgeUrl?: string | null;
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

export type ProjectedQualificationType =
  | "Ganador de grupo"
  | "Segundo de grupo"
  | "Mejor tercero";

export type ProjectedQualifier = {
  groupCode: string;
  isPlaceholder: false;
  originLabel: string;
  qualificationType: ProjectedQualificationType;
  ruleLabel?: string;
  slotLabel: string;
  sourceRank: 1 | 2 | 3;
  team: TournamentTeam;
  thirdRank?: number;
};

export type ProjectedPlaceholderSlot = {
  allowedGroupCodes?: string[];
  groupCode: string | null;
  isPlaceholder: true;
  originLabel: string;
  qualificationType: "Por definir";
  ruleLabel?: string;
  slotLabel: string;
  sourceRank: 1 | 2 | 3 | null;
  team: TournamentTeam;
};

export type ProjectedBracketSlot =
  | ProjectedQualifier
  | ProjectedPlaceholderSlot;

export type ProjectedBracketMatch = {
  away: ProjectedBracketSlot;
  home: ProjectedBracketSlot;
  id: string;
  matchNumber: number;
  roundLabel: "16avos";
  slotLabel: string;
};

export type ProjectedBracket = {
  completedGroups: number;
  isOfficialMapping: false;
  missingQualifiers: number;
  projectedTeams: ProjectedQualifier[];
  requiredGroups: number;
  requiredQualifiers: number;
  roundOf32: ProjectedBracketMatch[];
  status: "complete" | "incomplete";
  thirdPlaceCombination: {
    groups: string[];
    option: number;
    slotsByMatchNumber: Record<number, string>;
  } | null;
};

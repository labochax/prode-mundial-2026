import "server-only";

import { selectAdminResultMatches } from "@/lib/admin/results-control";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

type MatchRow = Database["public"]["Tables"]["matches"]["Row"];
type TeamRow = Database["public"]["Tables"]["teams"]["Row"];
type TeamSummary = Pick<TeamRow, "id" | "name_en" | "name_es" | "tla">;

export type AdminResultMatch = Pick<
  MatchRow,
  | "away_score"
  | "away_team_id"
  | "group_code"
  | "home_score"
  | "home_team_id"
  | "id"
  | "kickoff_at"
  | "match_number"
  | "stage"
  | "status"
> & {
  away_team: TeamSummary | null;
  home_team: TeamSummary | null;
};

const adminResultMatchSelect = `
  id,
  match_number,
  kickoff_at,
  status,
  stage,
  group_code,
  home_score,
  away_score,
  home_team_id,
  away_team_id,
  home_team:teams!matches_home_team_id_fkey(id,name_es,name_en,tla),
  away_team:teams!matches_away_team_id_fkey(id,name_es,name_en,tla)
`;

export async function getAdminResultMatches(now = new Date()) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("matches")
    .select(adminResultMatchSelect)
    .not("football_data_id", "is", null)
    .order("kickoff_at", { ascending: true });

  if (error) {
    throw error;
  }

  return selectAdminResultMatches(data as AdminResultMatch[], now);
}

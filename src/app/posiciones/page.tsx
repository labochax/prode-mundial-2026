import { redirect } from "next/navigation";

import { AuthenticatedAppShell } from "@/components/layout/authenticated-app-shell";
import { LeaderboardView } from "@/components/leaderboard/leaderboard-view";
import { mapPoolLeaderboardRows } from "@/lib/leaderboard/map-leaderboard";
import { ensureCurrentProfile } from "@/lib/supabase/profile-bootstrap";
import { getPoolLeaderboard } from "@/lib/supabase/queries/leaderboard";
import { getPoolLeaderboardProfileGroups } from "@/lib/supabase/queries/leaderboard-profiles";
import { getOrJoinDefaultPool } from "@/lib/supabase/queries/pools";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function StandingsPage() {
  const supabase = await createSupabaseServerClient();
  const current = await ensureCurrentProfile(supabase);

  if (!current) {
    redirect("/login");
  }

  const pool = await getOrJoinDefaultPool(supabase);
  const [leaderboardRows, groupsByUserId] = await Promise.all([
    getPoolLeaderboard(supabase, pool.id),
    getPoolLeaderboardProfileGroups(supabase, pool.id),
  ]);
  const players = mapPoolLeaderboardRows(
    leaderboardRows,
    current.user.id,
    groupsByUserId,
  );

  return (
    <AuthenticatedAppShell className="max-w-[88rem]">
      <LeaderboardView players={players} />
    </AuthenticatedAppShell>
  );
}

import { redirect } from "next/navigation";

import { AuthenticatedAppShell } from "@/components/layout/authenticated-app-shell";
import { LeaderboardView } from "@/components/leaderboard/leaderboard-view";
import { mapPoolLeaderboardRows } from "@/lib/leaderboard/map-leaderboard";
import { getLeaderboardRankTrends } from "@/lib/leaderboard/leaderboard-points";
import { ensureCurrentProfile } from "@/lib/supabase/profile-bootstrap";
import { getPoolLeaderboard } from "@/lib/supabase/queries/leaderboard";
import { getPoolLeaderboardProfileGroups } from "@/lib/supabase/queries/leaderboard-profiles";
import { getLeaderboardRecentResults } from "@/lib/supabase/queries/leaderboard-recent-results";
import { getOrJoinDefaultPool } from "@/lib/supabase/queries/pools";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function StandingsPage() {
  const supabase = await createSupabaseServerClient();
  const current = await ensureCurrentProfile(supabase);

  if (!current) {
    redirect("/login");
  }

  const pool = await getOrJoinDefaultPool(supabase);
  const [leaderboardRows, groupsByUserId, recentResults] = await Promise.all([
    getPoolLeaderboard(supabase, pool.id),
    getPoolLeaderboardProfileGroups(supabase, pool.id),
    getLeaderboardRecentResults(supabase, pool.id),
  ]);
  const trendsByUserId = getLeaderboardRankTrends(
    leaderboardRows,
    recentResults.trendWindowContributionsByUserId,
  );
  const players = mapPoolLeaderboardRows(
    leaderboardRows,
    current.user.id,
    groupsByUserId,
    recentResults.recentMarkersByUserId,
    trendsByUserId,
  );

  return (
    <AuthenticatedAppShell className="max-w-[88rem]">
      <LeaderboardView players={players} />
    </AuthenticatedAppShell>
  );
}

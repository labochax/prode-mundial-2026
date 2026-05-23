import { AuthenticatedAppShell } from "@/components/layout/authenticated-app-shell";
import { LeaderboardView } from "@/components/leaderboard/leaderboard-view";

export default function StandingsPage() {
  return (
    <AuthenticatedAppShell className="max-w-[88rem]">
      <LeaderboardView />
    </AuthenticatedAppShell>
  );
}

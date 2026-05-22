import { LeaderboardPlaceholder } from "@/components/leaderboard/leaderboard-placeholder";
import { AppShell } from "@/components/layout/app-shell";
import { MatchCardPlaceholder } from "@/components/prode/match-card-placeholder";

export default function DashboardPage() {
  // Final UI must be replaced/refined after the Stitch MCP audit.
  return (
    <AppShell
      title="Panel"
      description="Pantalla temporal del resumen del Prode. La pantalla final se ajustara a Stitch y a los datos reales del grupo."
      eyebrow="Panel temporal"
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <MatchCardPlaceholder matchLabel="Proximo partido por sincronizar" />
        <LeaderboardPlaceholder />
      </div>
    </AppShell>
  );
}

import { LeaderboardPlaceholder } from "@/components/leaderboard/leaderboard-placeholder";
import { AuthenticatedAppShell } from "@/components/layout/authenticated-app-shell";
import { MatchCardPlaceholder } from "@/components/prode/match-card-placeholder";

export default function DashboardPage() {
  // Final dashboard content still needs the audited Stitch prediction grid.
  return (
    <AuthenticatedAppShell
      title="Panel"
      description="Pantalla temporal del resumen del Prode. La pantalla final se ajustará a Stitch y a los datos reales del grupo."
      eyebrow="Panel temporal"
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <MatchCardPlaceholder matchLabel="Próximo partido por sincronizar" />
        <LeaderboardPlaceholder />
      </div>
    </AuthenticatedAppShell>
  );
}

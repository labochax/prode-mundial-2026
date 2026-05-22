import { LeaderboardPlaceholder } from "@/components/leaderboard/leaderboard-placeholder";
import { AuthenticatedAppShell } from "@/components/layout/authenticated-app-shell";

export default function StandingsPage() {
  // Final ranking content still needs the audited Stitch positions table.
  return (
    <AuthenticatedAppShell
      title="Posiciones"
      description="Vista temporal del ranking del grupo hasta que el modelo de puntaje y la pantalla de Stitch estén implementados."
      eyebrow="Tabla temporal"
    >
      <div className="max-w-2xl">
        <LeaderboardPlaceholder />
      </div>
    </AuthenticatedAppShell>
  );
}

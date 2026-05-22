import { LeaderboardPlaceholder } from "@/components/leaderboard/leaderboard-placeholder";
import { AppShell } from "@/components/layout/app-shell";

export default function StandingsPage() {
  // Final UI must be replaced/refined after the Stitch MCP audit.
  return (
    <AppShell
      title="Posiciones"
      description="Vista temporal del ranking del grupo hasta que el modelo de puntaje y la pantalla de Stitch esten implementados."
      eyebrow="Tabla temporal"
    >
      <div className="max-w-2xl">
        <LeaderboardPlaceholder />
      </div>
    </AppShell>
  );
}

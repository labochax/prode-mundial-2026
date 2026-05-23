import { ArrowDown } from "lucide-react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { MatchPredictionCard } from "@/components/dashboard/match-prediction-card";
import { AuthenticatedAppShell } from "@/components/layout/authenticated-app-shell";
import { mockDashboardMatches } from "@/lib/mock/matches";

export default function DashboardPage() {
  return (
    <AuthenticatedAppShell
      className="max-w-[90rem] gap-10"
      header={<DashboardHeader />}
    >
      <section
        aria-label="Partidos disponibles para cargar pronóstico"
        className="grid grid-cols-1 gap-6 xl:grid-cols-2"
      >
        {mockDashboardMatches.map((match) => (
          <MatchPredictionCard key={match.id} match={match} />
        ))}
      </section>

      <button
        className="prode-pressable flex w-full items-center justify-center gap-4 border-y-[3px] border-prode-black bg-transparent py-4 font-display text-2xl uppercase outline-none hover:bg-[#f7f4df] focus-visible:ring-[3px] focus-visible:ring-prode-black focus-visible:ring-offset-[3px] focus-visible:ring-offset-prode-paper"
        type="button"
      >
        <ArrowDown aria-hidden="true" className="size-6 stroke-[3]" />
        Cargar más partidos
        <ArrowDown aria-hidden="true" className="size-6 stroke-[3]" />
      </button>
    </AuthenticatedAppShell>
  );
}

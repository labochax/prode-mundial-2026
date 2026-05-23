import Link from "next/link";

import { AuthenticatedAppShell } from "@/components/layout/authenticated-app-shell";
import { MatchDetailToolbar } from "@/components/match-detail/match-detail-toolbar";
import { MatchStatsPanel } from "@/components/match-detail/match-stats-panel";
import { PredictionCanvas } from "@/components/match-detail/prediction-canvas";
import { ProdeBadge } from "@/components/prode/prode-badge";
import { getMockMatchById, getNextMockMatch } from "@/lib/mock/matches";

type MatchPageProps = {
  params: Promise<{ matchId: string }>;
};

export default async function MatchPage({ params }: MatchPageProps) {
  const { matchId } = await params;
  const match = getMockMatchById(matchId);
  const nextMatch = getNextMockMatch(matchId);

  if (!match) {
    return (
      <AuthenticatedAppShell
        className="max-w-[90rem]"
        title="Partido no encontrado"
        description="Esta pantalla usa datos locales de prueba. Más adelante se resolverá contra Supabase y Football-Data.org."
        eyebrow={`Partido ${matchId}`}
      >
        <section className="prode-frame prode-hard-shadow max-w-3xl bg-prode-surface p-6 sm:p-8">
          <ProdeBadge variant="surface">Sin datos mock</ProdeBadge>
          <h1 className="mt-4 font-display text-5xl uppercase leading-none">
            No encontramos ese partido
          </h1>
          <Link
            className="prode-frame prode-hard-shadow prode-pressable mt-6 inline-flex min-h-12 items-center justify-center bg-prode-yellow px-4 py-3 font-technical text-sm font-bold uppercase text-prode-black outline-none focus-visible:ring-[3px] focus-visible:ring-prode-black focus-visible:ring-offset-[3px] focus-visible:ring-offset-prode-paper"
            href="/dashboard"
          >
            Volver al panel
          </Link>
        </section>
      </AuthenticatedAppShell>
    );
  }

  return (
    <AuthenticatedAppShell
      className="max-w-[90rem] gap-8"
      header={<MatchDetailToolbar match={match} />}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <PredictionCanvas
            match={match}
            nextMatchHref={
              nextMatch ? `/partidos/${nextMatch.id}` : "/dashboard"
            }
            nextMatchLabel={
              nextMatch ? "Siguiente partido" : "Volver al panel"
            }
          />
        </div>

        <div className="lg:col-span-4">
          <MatchStatsPanel match={match} />
        </div>
      </div>
    </AuthenticatedAppShell>
  );
}

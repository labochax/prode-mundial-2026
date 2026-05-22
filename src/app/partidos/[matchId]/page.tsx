import { AppShell } from "@/components/layout/app-shell";
import { MatchCardPlaceholder } from "@/components/prode/match-card-placeholder";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type MatchPageProps = {
  params: Promise<{ matchId: string }>;
};

export default async function MatchPage({ params }: MatchPageProps) {
  // Final UI must be replaced/refined after the Stitch MCP audit.
  const { matchId } = await params;

  return (
    <AppShell
      title="Detalle de partido"
      description="Pantalla temporal del pronostico por partido. La edicion se habilitara solo antes del bloqueo correspondiente."
      eyebrow={`Partido ${matchId}`}
    >
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <MatchCardPlaceholder matchLabel={`Partido ${matchId}`} />
        <Card>
          <CardHeader>
            <CardTitle>Pronostico pendiente</CardTitle>
            <CardDescription>
              La visibilidad y el bloqueo se resolveran en backend.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            Todavia no hay formulario conectado ni resultados oficiales.
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

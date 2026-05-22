import { AppShell } from "@/components/layout/app-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ProfilePage() {
  // Final UI must be replaced/refined after the Stitch MCP audit.
  return (
    <AppShell
      title="Perfil"
      description="Vista temporal para datos del jugador, preferencias y estado dentro del grupo."
      eyebrow="Cuenta temporal"
    >
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Datos del jugador</CardTitle>
          <CardDescription>
            La lectura y edicion del perfil se conectaran despues.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-muted-foreground">
          No se muestran datos personales en esta base inicial.
        </CardContent>
      </Card>
    </AppShell>
  );
}

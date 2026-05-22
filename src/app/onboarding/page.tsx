import { AppShell } from "@/components/layout/app-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function OnboardingPage() {
  // Final UI must be replaced/refined after the Stitch MCP audit.
  return (
    <AppShell
      title="Bienvenida"
      description="Pantalla temporal para completar perfil, grupo y preferencias una vez que la autenticacion este definida."
      eyebrow="Configuracion inicial"
    >
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Primer ingreso</CardTitle>
          <CardDescription>
            El flujo final seguira las pantallas y reglas aprobadas.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-muted-foreground">
          Este paso todavia no guarda datos ni crea participaciones.
        </CardContent>
      </Card>
    </AppShell>
  );
}

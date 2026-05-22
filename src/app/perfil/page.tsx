import { AuthenticatedAppShell } from "@/components/layout/authenticated-app-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ProfilePage() {
  // Final profile edit content will reuse the audited Stitch profile language.
  return (
    <AuthenticatedAppShell
      title="Perfil"
      description="Vista temporal para datos del jugador, preferencias y estado dentro del grupo."
      eyebrow="Cuenta temporal"
    >
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Datos del jugador</CardTitle>
          <CardDescription>
            La lectura y edición del perfil se conectarán después.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-muted-foreground">
          No se muestran datos personales en esta base inicial.
        </CardContent>
      </Card>
    </AuthenticatedAppShell>
  );
}

import { LogIn } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  // Final UI must be replaced/refined after the Stitch MCP audit.
  return (
    <AppShell
      title="Ingreso"
      description="Pantalla temporal del acceso al Prode. La autenticacion de Google se conectara mediante Supabase en una iteracion posterior."
      eyebrow="Autenticacion pendiente"
    >
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Acceso del grupo</CardTitle>
          <CardDescription>
            Este formulario aun no inicia sesion ni consume credenciales.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button disabled>
            <LogIn data-icon="inline-start" />
            Continuar con Google
          </Button>
        </CardContent>
      </Card>
    </AppShell>
  );
}

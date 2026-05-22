import Link from "next/link";
import { ArrowRight, PanelsTopLeft } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HomePage() {
  // Final UI must be replaced/refined after the Stitch MCP audit.
  return (
    <AppShell
      title="Base inicial del Prode"
      description="Esta base organiza rutas, documentacion y limites de integracion. La interfaz final se refinara despues de auditar Stitch."
      eyebrow="Inicio temporal"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardAction>
              <Badge variant="outline">Temporal</Badge>
            </CardAction>
            <CardTitle>Rutas listas para iterar</CardTitle>
            <CardDescription>
              El flujo inicial queda visible sin presentar una pantalla final.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/login">
                Ir a ingreso
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">
                <PanelsTopLeft data-icon="inline-start" />
                Ver panel temporal
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fuente visual pendiente</CardTitle>
            <CardDescription>
              Stitch definira marca, disposicion y movimiento del producto.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            Esta base evita datos simulados ricos, APIs reales y decisiones
            visuales que no salgan del proyecto aprobado.
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

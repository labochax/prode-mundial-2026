import { ShieldAlert } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminSyncPage() {
  // Final UI must be replaced/refined after the Stitch MCP audit.
  return (
    <AppShell
      title="Administracion de sincronizacion"
      description="Vista temporal para operaciones autorizadas de fixture, resultados y recursos visuales."
      eyebrow="Admin temporal"
    >
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert aria-hidden className="size-4" />
            Sin sincronizacion activa
          </CardTitle>
          <CardDescription>
            Esta ruta aun no llama proveedores ni expone secretos.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-muted-foreground">
          La accion final debera validar permisos, cuotas y secretos server-side.
        </CardContent>
      </Card>
    </AppShell>
  );
}

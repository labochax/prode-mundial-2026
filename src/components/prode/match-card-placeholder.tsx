import { CalendarClock, LockKeyhole } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type MatchCardPlaceholderProps = {
  matchLabel?: string;
};

export function MatchCardPlaceholder({
  matchLabel = "Partido pendiente de datos",
}: MatchCardPlaceholderProps) {
  // Final match card structure must be refined from Stitch.
  return (
    <Card>
      <CardHeader>
        <CardAction>
          <Badge variant="outline">Temporal</Badge>
        </CardAction>
        <CardTitle>{matchLabel}</CardTitle>
        <CardDescription>
          El fixture y los resultados se conectaran en una iteracion posterior.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
        <p className="flex items-start gap-2">
          <CalendarClock aria-hidden className="mt-0.5 size-4 shrink-0" />
          Horario y estado saldran de la sincronizacion oficial.
        </p>
        <p className="flex items-start gap-2">
          <LockKeyhole aria-hidden className="mt-0.5 size-4 shrink-0" />
          El pronostico se bloquea por partido.
        </p>
      </CardContent>
    </Card>
  );
}

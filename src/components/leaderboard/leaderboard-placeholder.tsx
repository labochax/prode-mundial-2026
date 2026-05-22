import { Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function LeaderboardPlaceholder() {
  // Final leaderboard hierarchy must be refined after the Stitch audit.
  return (
    <Card>
      <CardHeader>
        <CardAction>
          <Badge variant="outline">Temporal</Badge>
        </CardAction>
        <CardTitle className="flex items-center gap-2">
          <Trophy aria-hidden className="size-4" />
          Posiciones
        </CardTitle>
        <CardDescription>
          El ranking aparecera cuando el puntaje este modelado y calculado.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm leading-6 text-muted-foreground">
        El marcador exacto vale 3 puntos y el resultado correcto vale 1 punto.
      </CardContent>
    </Card>
  );
}

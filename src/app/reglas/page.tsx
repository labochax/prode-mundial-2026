import { AlertTriangle, Database, Target } from "lucide-react";

import { AuthenticatedAppShell } from "@/components/layout/authenticated-app-shell";
import { ProdeBadge } from "@/components/prode/prode-badge";
import { RulesCard } from "@/components/rules/rules-card";

const scoringRules = [
  {
    points: "3",
    title: "Resultado exacto",
    text: "Acertás los goles de ambos equipos.",
  },
  {
    points: "1",
    title: "Resultado general",
    text: "Acertás ganador o empate, aunque no el marcador.",
  },
  {
    points: "0",
    title: "Pronóstico errado",
    text: "No coincide ni el ganador ni el empate.",
  },
] as const;

export default function RulesPage() {
  return (
    <AuthenticatedAppShell
      className="max-w-[88rem]"
      eyebrow="Manual del juego"
      title="Reglas del Prode"
      description="Reglas simples para cargar pronósticos, esperar el bloqueo de cada partido y competir por la tabla del grupo."
    >
      <section
        aria-label="Sistema de puntaje"
        className="grid grid-cols-1 gap-5 lg:grid-cols-3"
      >
        {scoringRules.map((rule) => (
          <article
            className="prode-frame prode-hard-shadow bg-prode-surface p-5"
            key={rule.points}
          >
            <div className="flex items-start justify-between gap-4">
              <ProdeBadge variant={rule.points === "3" ? "primary" : "surface"}>
                {rule.points === "1" ? "1 punto" : `${rule.points} puntos`}
              </ProdeBadge>
              <Target aria-hidden="true" className="size-7 stroke-[3]" />
            </div>
            <h2 className="mt-5 font-display text-3xl uppercase leading-none">
              {rule.title}
            </h2>
            <p className="mt-3 leading-7 text-muted-foreground">{rule.text}</p>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <RulesCard eyebrow="Bloqueo" title="Cada partido cierra solo">
          <p>
            Las predicciones se bloquean por partido, no de manera global. El
            cierre actual es 10 minutos antes del inicio de cada partido.
          </p>
        </RulesCard>

        <RulesCard eyebrow="Edición" title="Cambios hasta el cierre">
          <p>
            Podés editar tu pronóstico todas las veces que quieras hasta que ese
            partido quede bloqueado.
          </p>
        </RulesCard>

        <RulesCard eyebrow="Visibilidad" title="Pronósticos visibles al cerrar">
          <p>
            Cuando un partido queda bloqueado, las predicciones de los demás
            jugadores para ese partido pasan a estar visibles. La intención es
            poder verlas desde el detalle del partido y desde los perfiles o
            ranking de jugadores cuando esa vista esté disponible.
          </p>
        </RulesCard>

        <RulesCard eyebrow="Estado actual" title="Datos conectados">
          <p>
            Los partidos y predicciones ya se guardan en Supabase. Los fixtures
            oficiales se pueden sincronizar con Football-Data y la tabla de
            posiciones usa los puntos calculados desde la base de datos.
          </p>
        </RulesCard>
      </section>

      <section className="prode-frame prode-hard-shadow grid gap-5 bg-prode-yellow p-5 sm:p-6 lg:grid-cols-[auto_1fr] lg:items-center">
        <div className="flex size-16 items-center justify-center border-[3px] border-prode-black bg-prode-surface">
          <AlertTriangle aria-hidden="true" className="size-9 stroke-[3]" />
        </div>
        <div>
          <h2 className="font-display text-3xl uppercase leading-none">
            Penales y predicción de campeón
          </h2>
          <p className="mt-2 max-w-4xl leading-7">
            Por ahora no se predicen penales. También queda pendiente definir si
            habrá bonus por acertar el campeón del mundo antes del inicio del
            torneo.
          </p>
        </div>
      </section>

      <RulesCard eyebrow="Bonus" title="Campeón del mundo">
        <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-start">
          <div className="flex size-14 items-center justify-center border-[3px] border-prode-black bg-prode-yellow">
            <Database aria-hidden="true" className="size-7 stroke-[3]" />
          </div>
          <p>
            La predicción de campeón es una regla candidata: se cerraría antes
            del primer partido del Mundial y podría sumar puntos bonus. Todavía
            no está activa.
          </p>
        </div>
      </RulesCard>
    </AuthenticatedAppShell>
  );
}

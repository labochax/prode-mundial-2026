import { AlertTriangle, Eye, LockKeyhole, Pencil, Target } from "lucide-react";

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
                {rule.points} puntos
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
            cierre predeterminado es 10 minutos antes del inicio.
          </p>
        </RulesCard>

        <RulesCard eyebrow="Edición" title="Cambios hasta el cierre">
          <p>
            Podés editar tu pronóstico todas las veces que quieras hasta que ese
            partido quede bloqueado.
          </p>
        </RulesCard>

        <RulesCard eyebrow="Visibilidad" title="Pronósticos públicos al cerrar">
          <p>
            Cuando un partido se bloquea, las predicciones de todos para ese
            partido pasan a estar visibles.
          </p>
        </RulesCard>

        <RulesCard eyebrow="MVP" title="Alcance actual">
          <p>
            Los penales no se predicen todavía. Los partidos, puntos y estados
            actuales son datos mock hasta integrar Supabase y las APIs
            deportivas.
          </p>
        </RulesCard>
      </section>

      <section className="prode-frame prode-hard-shadow grid gap-5 bg-prode-yellow p-5 sm:p-6 lg:grid-cols-[auto_1fr] lg:items-center">
        <div className="flex size-16 items-center justify-center border-[3px] border-prode-black bg-prode-surface">
          <AlertTriangle aria-hidden="true" className="size-9 stroke-[3]" />
        </div>
        <div>
          <h2 className="font-display text-3xl uppercase leading-none">
            Decisiones pendientes
          </h2>
          <p className="mt-2 max-w-4xl leading-7">
            La lógica definitiva de bloqueo, visibilidad y puntaje deberá quedar
            protegida en servidor y base de datos cuando se conecte Supabase.
          </p>
        </div>
      </section>

      <section
        aria-label="Resumen operativo"
        className="grid grid-cols-1 gap-4 md:grid-cols-3"
      >
        <div className="prode-frame bg-prode-surface p-4">
          <LockKeyhole aria-hidden="true" className="size-6 stroke-[3]" />
          <p className="mt-3 font-technical text-sm font-bold uppercase">
            Cierre por partido
          </p>
        </div>
        <div className="prode-frame bg-prode-surface p-4">
          <Eye aria-hidden="true" className="size-6 stroke-[3]" />
          <p className="mt-3 font-technical text-sm font-bold uppercase">
            Visibilidad al bloquear
          </p>
        </div>
        <div className="prode-frame bg-prode-surface p-4">
          <Pencil aria-hidden="true" className="size-6 stroke-[3]" />
          <p className="mt-3 font-technical text-sm font-bold uppercase">
            Edición antes del cierre
          </p>
        </div>
      </section>
    </AuthenticatedAppShell>
  );
}
